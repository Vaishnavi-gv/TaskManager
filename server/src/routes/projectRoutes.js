import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { authRequired, loadUser } from '../middleware/auth.js';
import {
  requireProjectMember,
  requireProjectAdmin,
} from '../middleware/projectAccess.js';

const router = Router({ mergeParams: true });

router.use(authRequired, loadUser);

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
}

/** List projects where current user is a member */
router.get('/', async (req, res, next) => {
  try {
    const projects = await Project.find({ 'members.user': req.userId })
      .sort({ updatedAt: -1 })
      .populate('owner', 'name email')
      .lean();
    const withStats = await Promise.all(
      projects.map(async (p) => {
        const [counts, overdue] = await Promise.all([
          Task.aggregate([
            { $match: { project: p._id } },
            { $group: { _id: '$status', n: { $sum: 1 } } },
          ]),
          Task.countDocuments({
            project: p._id,
            status: { $ne: 'done' },
            dueDate: { $lt: new Date() },
          }),
        ]);
        const statusMap = Object.fromEntries(counts.map((c) => [c._id, c.n]));
        return {
          id: p._id,
          name: p.name,
          description: p.description,
          owner: p.owner,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          myRole: p.members.find((m) => m.user.toString() === req.userId)?.role,
          taskCounts: {
            todo: statusMap.todo || 0,
            in_progress: statusMap.in_progress || 0,
            done: statusMap.done || 0,
            blocked: statusMap.blocked || 0,
            overdue,
          },
        };
      })
    );
    res.json({ projects: withStats });
  } catch (e) {
    next(e);
  }
});

router.post(
  '/',
  body('name').trim().notEmpty().isLength({ max: 200 }),
  body('description').optional().isString().isLength({ max: 2000 }),
  validate,
  async (req, res, next) => {
    try {
      const { name, description = '' } = req.body;
      const project = await Project.create({
        name,
        description,
        owner: req.userId,
        members: [{ user: req.userId, role: 'admin' }],
      });
      const populated = await Project.findById(project._id)
        .populate('owner', 'name email')
        .lean();
      res.status(201).json({
        project: {
          id: populated._id,
          name: populated.name,
          description: populated.description,
          owner: populated.owner,
          myRole: 'admin',
          members: populated.members,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  '/:id',
  param('id').isMongoId(),
  validate,
  requireProjectMember,
  async (req, res, next) => {
    try {
      const p = await Project.findById(req.params.id)
        .populate('owner', 'name email')
        .populate('members.user', 'name email')
        .lean();
      res.json({
        project: {
          id: p._id,
          name: p.name,
          description: p.description,
          owner: p.owner,
          myRole: req.membershipRole,
          members: p.members.map((m) => ({
            user: m.user,
            role: m.role,
          })),
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  '/:id',
  param('id').isMongoId(),
  body('name').optional().trim().notEmpty().isLength({ max: 200 }),
  body('description').optional().isString().isLength({ max: 2000 }),
  validate,
  requireProjectMember,
  requireProjectAdmin,
  async (req, res, next) => {
    try {
      const { name, description } = req.body;
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
      }
      const p = await Project.findByIdAndUpdate(req.params.id, updates, {
        new: true,
      })
        .populate('owner', 'name email')
        .lean();
      res.json({
        project: {
          id: p._id,
          name: p.name,
          description: p.description,
          owner: p.owner,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  '/:id',
  param('id').isMongoId(),
  validate,
  requireProjectMember,
  requireProjectAdmin,
  async (req, res, next) => {
    try {
      await Task.deleteMany({ project: req.params.id });
      await Project.findByIdAndDelete(req.params.id);
      res.json({ message: 'Project deleted' });
    } catch (e) {
      next(e);
    }
  }
);

/** Add member by email (admin) */
router.post(
  '/:id/members',
  param('id').isMongoId(),
  body('email').isEmail().normalizeEmail(),
  body('role').optional().isIn(['admin', 'member']),
  validate,
  requireProjectMember,
  requireProjectAdmin,
  async (req, res, next) => {
    try {
      const { email, role = 'member' } = req.body;
      const user = await User.findOne({ email }).lean();
      if (!user) {
        return res.status(404).json({ message: 'No user with that email' });
      }
      const project = await Project.findById(req.params.id);
      if (project.members.some((m) => m.user.toString() === user._id.toString())) {
        return res.status(409).json({ message: 'User is already a member' });
      }
      project.members.push({ user: user._id, role });
      await project.save();
      const u = await User.findById(user._id).select('name email').lean();
      res.status(201).json({
        member: { user: { id: u._id, name: u.name, email: u.email }, role },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  '/:id/members/:userId',
  param('id').isMongoId(),
  param('userId').isMongoId(),
  body('role').isIn(['admin', 'member']),
  validate,
  requireProjectMember,
  requireProjectAdmin,
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      const project = await Project.findById(req.params.id);
      const ownerId = project.owner.toString();
      if (userId === ownerId && role === 'member') {
        return res.status(400).json({ message: 'Project owner must remain an admin' });
      }
      const idx = project.members.findIndex((m) => m.user.toString() === userId);
      if (idx === -1) return res.status(404).json({ message: 'Member not found' });
      project.members[idx].role = role;
      await project.save();
      res.json({ message: 'Role updated' });
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  '/:id/members/:userId',
  param('id').isMongoId(),
  param('userId').isMongoId(),
  validate,
  requireProjectMember,
  requireProjectAdmin,
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const project = await Project.findById(req.params.id);
      if (userId === project.owner.toString()) {
        return res.status(400).json({ message: 'Cannot remove project owner' });
      }
      project.members = project.members.filter((m) => m.user.toString() !== userId);
      await project.save();
      await Task.updateMany(
        { project: project._id, assignee: userId },
        { $set: { assignee: null } }
      );
      res.json({ message: 'Member removed' });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
