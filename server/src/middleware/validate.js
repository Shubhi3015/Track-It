import { validationResult } from 'express-validator';
import { clean } from '../utils/sanitize.js';

export function sanitizeBody(req, _res, next) {
  req.body = clean(req.body);
  req.query = clean(req.query);
  next();
}

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
}
