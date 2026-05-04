import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { authRequired, loadUser, signToken } from '../middleware/auth.js';

const router = Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
}

router.post(
  '/register',
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidation,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(409).json({ message: 'Email already registered' });
      }
      const user = await User.create({ name, email, password });
      const token = signToken(user._id);
      return res.status(201).json({
        token,
        user: { id: user._id, name: user.name, email: user.email },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  handleValidation,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      const token = signToken(user._id);
      return res.json({
        token,
        user: { id: user._id, name: user.name, email: user.email },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get('/me', authRequired, loadUser, (req, res) => {
  res.json({
    user: { id: req.user._id, name: req.user.name, email: req.user.email },
  });
});

export default router;
