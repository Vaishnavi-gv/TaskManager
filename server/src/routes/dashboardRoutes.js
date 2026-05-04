import { Router } from 'express';
import mongoose from 'mongoose';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { authRequired, loadUser } from '../middleware/auth.js';

const router = Router();

router.use(authRequired, loadUser);

router.get('/', async (req, res, next) => {
  try {
    const projectIds = await Project.find({ 'members.user': req.userId }).distinct('_id');
    if (projectIds.length === 0) {
      return res.json({
        summary: {
          totalTasks: 0,
          todo: 0,
          inProgress: 0,
          done: 0,
          blocked: 0,
          overdue: 0,
          myOpenTasks: 0,
        },
        recentTasks: [],
        projects: [],
      });
    }
    const pids = projectIds.map((id) => new mongoose.Types.ObjectId(id));
    const now = new Date();
    const [byStatus, overdue, myOpen, recent, projectList] = await Promise.all([
      Task.aggregate([
        { $match: { project: { $in: pids } } },
        { $group: { _id: '$status', n: { $sum: 1 } } },
      ]),
      Task.countDocuments({
        project: { $in: pids },
        status: { $ne: 'done' },
        dueDate: { $lt: now },
      }),
      Task.countDocuments({
        project: { $in: pids },
        status: { $ne: 'done' },
        assignee: new mongoose.Types.ObjectId(req.userId),
      }),
      Task.find({ project: { $in: pids } })
        .sort({ updatedAt: -1 })
        .limit(8)
        .populate('project', 'name')
        .populate('assignee', 'name email')
        .lean(),
      Project.find({ _id: { $in: pids } })
        .select('name')
        .sort({ name: 1 })
        .lean(),
    ]);
    const map = Object.fromEntries(byStatus.map((s) => [s._id, s.n]));
    const total =
      (map.todo || 0) + (map.in_progress || 0) + (map.done || 0) + (map.blocked || 0);
    res.json({
      summary: {
        totalTasks: total,
        todo: map.todo || 0,
        inProgress: map.in_progress || 0,
        done: map.done || 0,
        blocked: map.blocked || 0,
        overdue,
        myOpenTasks: myOpen,
      },
      recentTasks: recent.map((t) => ({
        id: t._id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        project: t.project,
        assignee: t.assignee,
        updatedAt: t.updatedAt,
      })),
      projects: projectList.map((p) => ({ id: p._id, name: p.name })),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
