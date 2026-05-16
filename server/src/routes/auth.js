import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hashToken, issueTokens, publicUser, signAccessToken } from '../utils/tokens.js';

const router = express.Router();

const authValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters'),
    ...authValidators,
    validate
  ],
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows[0]) return res.status(409).json({ message: 'Email is already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, passwordHash, 'member']
    );
    const tokens = await issueTokens(rows[0]);
    res.status(201).json(tokens);
  })
);

router.post('/login', [...authValidators, validate], asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  res.json(await issueTokens(user));
}));

router.post('/refresh', [body('refreshToken').isString().notEmpty(), validate], asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await query(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()',
    [tokenHash]
  );
  if (!stored.rows[0]) return res.status(401).json({ message: 'Refresh token is not active' });

  const userResult = await query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [payload.id]);
  if (!userResult.rows[0]) return res.status(401).json({ message: 'User no longer exists' });

  res.json({ accessToken: signAccessToken(userResult.rows[0]), user: publicUser(userResult.rows[0]) });
}));

router.post('/logout', [body('refreshToken').optional().isString(), validate], authMiddleware, asyncHandler(async (req, res) => {
  if (req.body.refreshToken) {
    await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1', [hashToken(req.body.refreshToken)]);
  } else {
    await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [req.user.id]);
  }
  res.json({ message: 'Logged out' });
}));

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
