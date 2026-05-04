import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { authRequired, loadUser } from '../middleware/auth.js';
import {
  requireProjectMember,
  requireProjectAdmin,
} from '../middleware/projectAccess.js';

const router = Router({ mergeParams: true });

router.use(authRequired, loadUser, requireProjectMember);

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
}

function canEditTask(task, userId, role) {
  if (role === 'admin') return true;
  if (task.assignee && task.assignee.toString() === userId) return true;
  if (task.createdBy.toString() === userId) return true;
  return false;
}

/** List tasks for project */
router.get(
  '/',
  query('status').optional().isIn(['todo', 'in_progress', 'done', 'blocked', 'all']),
  query('overdue').optional().isIn(['1', 'true', '0', 'false']),
  validate,
  async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const q = { project: projectId };
      if (req.query.status && req.query.status !== 'all') {
        q.status = req.query.status;
      }
      if (req.query.overdue === '1' || req.query.overdue === 'true') {
        q.status = { $ne: 'done' };
        q.dueDate = { $lt: new Date() };
      }
      const tasks = await Task.find(q)
        .populate('assignee', 'name email')
        .populate('createdBy', 'name email')
        .sort({ dueDate: 1, createdAt: -1 })
        .lean();
      res.json({
        tasks: tasks.map((t) => ({
          id: t._id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
          assignee: t.assignee,
          createdBy: t.createdBy,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        })),
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/',
  body('title').trim().notEmpty().isLength({ max: 300 }),
  body('description').optional().isString().isLength({ max: 5000 }),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'done', 'blocked']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('dueDate').optional().isISO8601().toDate(),
  body('assignee').optional().custom((v) => !v || mongoose.isValidObjectId(v)),
  validate,
  async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const { title, description, status, priority, dueDate, assignee } = req.body;
      const project = req.project;
      if (assignee) {
        const ok = project.members.some((m) => m.user.toString() === assignee);
        if (!ok) {
          return res.status(400).json({ message: 'Assignee must be a project member' });
        }
      }
      const task = await Task.create({
        project: projectId,
        title,
        description: description ?? '',
        status: status || 'todo',
        priority: priority || 'medium',
        dueDate: dueDate || null,
        assignee: assignee || null,
        createdBy: req.userId,
      });
      const populated = await Task.findById(task._id)
        .populate('assignee', 'name email')
        .populate('createdBy', 'name email')
        .lean();
      res.status(201).json({
        task: {
          id: populated._id,
          title: populated.title,
          description: populated.description,
          status: populated.status,
          priority: populated.priority,
          dueDate: populated.dueDate,
          assignee: populated.assignee,
          createdBy: populated.createdBy,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  '/:taskId',
  param('taskId').isMongoId(),
  body('title').optional().trim().notEmpty().isLength({ max: 300 }),
  body('description').optional().isString().isLength({ max: 5000 }),
  body('status').optional().isIn(['todo', 'in_progress', 'done', 'blocked']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('dueDate').optional({ nullable: true }).isISO8601().toDate(),
  body('assignee').optional({ nullable: true }).custom((v) => v === null || mongoose.isValidObjectId(v)),
  validate,
  async (req, res, next) => {
    try {
      const { projectId, taskId } = req.params;
      const task = await Task.findOne({ _id: taskId, project: projectId });
      if (!task) return res.status(404).json({ message: 'Task not found' });
      if (!canEditTask(task, req.userId, req.membershipRole)) {
        return res.status(403).json({ message: 'Not allowed to edit this task' });
      }
      const { title, description, status, priority, dueDate, assignee } = req.body;
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (assignee !== undefined) {
        if (assignee === null) {
          task.assignee = null;
        } else {
          const project = req.project;
          const ok = project.members.some((m) => m.user.toString() === assignee);
          if (!ok) {
            return res.status(400).json({ message: 'Assignee must be a project member' });
          }
          task.assignee = assignee;
        }
      }
      await task.save();
      const populated = await Task.findById(task._id)
        .populate('assignee', 'name email')
        .populate('createdBy', 'name email')
        .lean();
      res.json({
        task: {
          id: populated._id,
          title: populated.title,
          description: populated.description,
          status: populated.status,
          priority: populated.priority,
          dueDate: populated.dueDate,
          assignee: populated.assignee,
          createdBy: populated.createdBy,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  '/:taskId',
  param('taskId').isMongoId(),
  validate,
  async (req, res, next) => {
    try {
      const { projectId, taskId } = req.params;
      const task = await Task.findOne({ _id: taskId, project: projectId });
      if (!task) return res.status(404).json({ message: 'Task not found' });
      const isAdmin = req.membershipRole === 'admin';
      const isCreator = task.createdBy.toString() === req.userId;
      if (!isAdmin && !isCreator) {
        return res.status(403).json({ message: 'Not allowed to delete this task' });
      }
      await task.deleteOne();
      res.json({ message: 'Task deleted' });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
