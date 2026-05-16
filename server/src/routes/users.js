import express from 'express';
import { body, param } from 'express-validator';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { publicUser } from '../utils/tokens.js';

const router = express.Router();
router.use(authMiddleware, roleMiddleware('admin'));

router.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
  res.json({ users: rows.map(publicUser) });
}));

router.put('/:id/role', [param('id').isUUID(), body('role').isIn(['admin', 'member']), validate], asyncHandler(async (req, res) => {
  const { rows } = await query(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role, created_at',
    [req.body.role, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ message: 'User not found' });
  res.json({ user: publicUser(rows[0]) });
}));

export default router;
