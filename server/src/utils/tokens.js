import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

export function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

export async function signRefreshToken(user) {
  const token = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await query('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [
    user.id,
    tokenHash,
    expiresAt
  ]);
  return token;
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function issueTokens(user) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: await signRefreshToken(user),
    user: publicUser(user)
  };
}

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at || user.createdAt
  };
}
