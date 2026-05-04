import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.use(authRequired);

router.get(
  '/search',
  query('q').optional().isString().trim().isLength({ min: 1, max: 80 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    try {
      const q = req.query.q;
      if (!q) {
        return res.json({ users: [] });
      }
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const users = await User.find({
        $or: [{ name: rx }, { email: rx }],
      })
        .select('name email')
        .limit(15)
        .lean();
      return res.json({
        users: users.map((u) => ({ id: u._id, name: u.name, email: u.email })),
      });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
