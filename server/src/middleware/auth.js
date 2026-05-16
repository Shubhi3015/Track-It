import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

export async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [payload.id]);
    if (!rows[0]) return res.status(401).json({ message: 'User no longer exists' });

    req.user = rows[0];
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function roleMiddleware(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}
