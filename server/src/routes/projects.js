import express from 'express';
import { body, param } from 'express-validator';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.use(authMiddleware);

const projectValidators = [
  body('name').trim().isLength({ min: 2, max: 120 }),
  body('description').optional().trim().isLength({ max: 1200 }),
  validate
];

router.post('/', roleMiddleware('admin'), projectValidators, asyncHandler(async (req, res) => {
  const { name, description = '' } = req.body;
  const { rows } = await query(
    'INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
    [name, description, req.user.id]
  );
  await query('INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [
    rows[0].id,
    req.user.id,
    'owner'
  ]);
  res.status(201).json({ project: await projectSummary(rows[0].id) });
}));

router.get('/', asyncHandler(async (req, res) => {
  const result = await query(
    `
      SELECT p.*,
        COUNT(DISTINCT pm.user_id)::int AS member_count,
        COUNT(DISTINCT t.id)::int AS task_count,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', u.id, 'name', u.name, 'email', u.email, 'role', u.role))
          FILTER (WHERE u.id IS NOT NULL), '[]') AS members
      FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id
      LEFT JOIN users u ON u.id = pm.user_id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE ($1 = 'admin' OR p.id IN (SELECT project_id FROM project_members WHERE user_id = $2))
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `,
    [req.user.role, req.user.id]
  );
  res.json({ projects: result.rows.map(formatProject) });
}));

router.get('/:id', [param('id').isUUID(), validate], asyncHandler(async (req, res) => {
  await ensureProjectAccess(req.params.id, req.user);
  const project = await projectSummary(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  const tasks = await query(
    `
      SELECT t.*, u.name AS assignee_name, u.email AS assignee_email
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.project_id = $1
      ORDER BY t.created_at DESC
    `,
    [req.params.id]
  );
  res.json({ project, tasks: tasks.rows.map(formatTask) });
}));

router.put('/:id', roleMiddleware('admin'), [param('id').isUUID(), ...projectValidators], asyncHandler(async (req, res) => {
  const { name, description = '' } = req.body;
  const { rowCount } = await query('UPDATE projects SET name = $1, description = $2 WHERE id = $3', [
    name,
    description,
    req.params.id
  ]);
  if (!rowCount) return res.status(404).json({ message: 'Project not found' });
  res.json({ project: await projectSummary(req.params.id) });
}));

router.delete('/:id', roleMiddleware('admin'), [param('id').isUUID(), validate], asyncHandler(async (req, res) => {
  const { rowCount } = await query('DELETE FROM projects WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ message: 'Project not found' });
  res.json({ message: 'Project deleted' });
}));

router.post(
  '/:id/members',
  roleMiddleware('admin'),
  [param('id').isUUID(), body('userId').isUUID(), validate],
  asyncHandler(async (req, res) => {
    const project = await query('SELECT id FROM projects WHERE id = $1', [req.params.id]);
    if (!project.rows[0]) return res.status(404).json({ message: 'Project not found' });
    const user = await query('SELECT id FROM users WHERE id = $1', [req.body.userId]);
    if (!user.rows[0]) return res.status(404).json({ message: 'User not found' });

    await query('INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [
      req.params.id,
      req.body.userId,
      'member'
    ]);
    res.status(201).json({ project: await projectSummary(req.params.id) });
  })
);

router.delete(
  '/:id/members/:userId',
  roleMiddleware('admin'),
  [param('id').isUUID(), param('userId').isUUID(), validate],
  asyncHandler(async (req, res) => {
    await query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [req.params.id, req.params.userId]);
    res.json({ project: await projectSummary(req.params.id) });
  })
);

async function ensureProjectAccess(projectId, user) {
  if (user.role === 'admin') return true;
  const { rows } = await query('SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2', [
    projectId,
    user.id
  ]);
  if (!rows[0]) {
    const error = new Error('Project access denied');
    error.status = 403;
    throw error;
  }
  return true;
}

async function projectSummary(id) {
  const { rows } = await query(
    `
      SELECT p.*,
        COUNT(DISTINCT pm.user_id)::int AS member_count,
        COUNT(DISTINCT t.id)::int AS task_count,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', u.id, 'name', u.name, 'email', u.email, 'role', u.role))
          FILTER (WHERE u.id IS NOT NULL), '[]') AS members
      FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id
      LEFT JOIN users u ON u.id = pm.user_id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.id = $1
      GROUP BY p.id
    `,
    [id]
  );
  return rows[0] ? formatProject(rows[0]) : null;
}

function formatProject(project) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    createdBy: project.created_by,
    createdAt: project.created_at,
    memberCount: project.member_count,
    taskCount: project.task_count,
    members: project.members || []
  };
}

function formatTask(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    projectId: task.project_id,
    assignedTo: task.assigned_to,
    assigneeName: task.assignee_name,
    assigneeEmail: task.assignee_email,
    createdBy: task.created_by,
    status: task.status,
    priority: task.priority,
    dueDate: task.due_date,
    createdAt: task.created_at,
    updatedAt: task.updated_at
  };
}

export default router;
