import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export async function loadUser(req, res, next) {
  if (!req.userId) return next();
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}

export function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set');
  return s;
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, getJwtSecret(), { expiresIn: '7d' });
}
