import mongoose from 'mongoose';
import { Project } from '../models/Project.js';

/**
 * Attaches req.project, req.membershipRole ('admin' | 'member') for project :id routes
 */
export async function requireProjectMember(req, res, next) {
  const { projectId, id } = req.params;
  const raw = projectId || id;
  if (!raw || !mongoose.isValidObjectId(raw)) {
    return res.status(400).json({ message: 'Invalid project id' });
  }
  try {
    const project = await Project.findById(raw).lean();
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const member = project.members.find(
      (m) => m.user.toString() === req.userId
    );
    if (!member) {
      return res.status(403).json({ message: 'Not a member of this project' });
    }
    req.project = project;
    req.membershipRole = member.role;
    next();
  } catch (e) {
    next(e);
  }
}

export function requireProjectAdmin(req, res, next) {
  if (req.membershipRole !== 'admin') {
    return res.status(403).json({ message: 'Admin role required' });
  }
  next();
}
