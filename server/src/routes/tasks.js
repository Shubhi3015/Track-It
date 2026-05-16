import express from 'express';
import { body, param, query as queryParam } from 'express-validator';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();
router.use(authMiddleware);

const statuses = ['todo', 'in_progress', 'done', 'overdue'];
const priorities = ['low', 'medium', 'high'];

const taskValidators = [
  body('title').trim().isLength({ min: 2, max: 160 }),
  body('description').optional().trim().isLength({ max: 1600 }),
  body('projectId').isUUID(),
  body('assignedTo').optional({ nullable: true }).isUUID(),
  body('status').optional().isIn(statuses),
  body('priority').optional().isIn(priorities),
  body('dueDate').optional({ nullable: true }).isISO8601().toDate(),
  validate
];

router.post('/', roleMiddleware('admin'), taskValidators, asyncHandler(async (req, res) => {
  const { title, description = '', projectId, assignedTo = null, status = 'todo', priority = 'medium', dueDate = null } = req.body;
  await ensureProjectExists(projectId);
  if (assignedTo) await ensureProjectMember(projectId, assignedTo);
  const { rows } = await query(
    `
      INSERT INTO tasks (title, description, project_id, assigned_to, created_by, status, priority, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
    [title, description, projectId, assignedTo, req.user.id, status, priority, dueDate]
  );
  res.status(201).json({ task: await taskWithRelations(rows[0].id) });
}));

router.get(
  '/',
  [
    queryParam('project').optional().isUUID(),
    queryParam('status').optional().isIn(statuses),
    queryParam('assignee').optional().isUUID(),
    queryParam('priority').optional().isIn(priorities),
    validate
  ],
  asyncHandler(async (req, res) => {
    const filters = {
      project: req.query.project || null,
      status: req.query.status || null,
      assignee: req.query.assignee || null,
      priority: req.query.priority || null
    };
    const result = await query(
      `
        SELECT t.*, p.name AS project_name, u.name AS assignee_name, u.email AS assignee_email
        FROM tasks t
        JOIN projects p ON p.id = t.project_id
        LEFT JOIN users u ON u.id = t.assigned_to
        WHERE ($1::uuid IS NULL OR t.project_id = $1)
          AND ($2::text IS NULL OR t.status = $2)
          AND ($3::uuid IS NULL OR t.assigned_to = $3)
          AND ($4::text IS NULL OR t.priority = $4)
          AND ($5 = 'admin' OR t.project_id IN (SELECT project_id FROM project_members WHERE user_id = $6))
        ORDER BY t.due_date NULLS LAST, t.created_at DESC
      `,
      [filters.project, filters.status, filters.assignee, filters.priority, req.user.role, req.user.id]
    );
    res.json({ tasks: result.rows.map(formatTask) });
  })
);

router.get('/my-tasks', asyncHandler(async (req, res) => {
  const result = await query(
    `
      SELECT t.*, p.name AS project_name, u.name AS assignee_name, u.email AS assignee_email
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.assigned_to = $1
      ORDER BY t.due_date NULLS LAST, t.created_at DESC
    `,
    [req.user.id]
  );
  res.json({ tasks: result.rows.map(formatTask) });
}));

router.get('/:id', [param('id').isUUID(), validate], asyncHandler(async (req, res) => {
  const task = await taskWithRelations(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  await ensureTaskAccess(task, req.user);
  res.json({ task });
}));

router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('title').optional().trim().isLength({ min: 2, max: 160 }),
    body('description').optional().trim().isLength({ max: 1600 }),
    body('projectId').optional().isUUID(),
    body('assignedTo').optional({ nullable: true }).isUUID(),
    body('status').optional().isIn(statuses),
    body('priority').optional().isIn(priorities),
    body('dueDate').optional({ nullable: true }).isISO8601().toDate(),
    validate
  ],
  asyncHandler(async (req, res) => {
    const existing = await taskWithRelations(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Task not found' });
    await ensureTaskAccess(existing, req.user);

    if (req.user.role !== 'admin') {
      if (Object.keys(req.body).some((key) => key !== 'status')) {
        return res.status(403).json({ message: 'Members can only update status' });
      }
      if (existing.assignedTo !== req.user.id) {
        return res.status(403).json({ message: 'Only the assignee can update this task' });
      }
    }

    const next = {
      title: req.body.title ?? existing.title,
      description: req.body.description ?? existing.description,
      projectId: req.body.projectId ?? existing.projectId,
      assignedTo: req.body.assignedTo === undefined ? existing.assignedTo : req.body.assignedTo,
      status: req.body.status ?? existing.status,
      priority: req.body.priority ?? existing.priority,
      dueDate: req.body.dueDate === undefined ? existing.dueDate : req.body.dueDate
    };
    await ensureProjectExists(next.projectId);
    if (next.assignedTo) await ensureProjectMember(next.projectId, next.assignedTo);

    await query(
      `
        UPDATE tasks
        SET title = $1, description = $2, project_id = $3, assigned_to = $4, status = $5,
            priority = $6, due_date = $7, updated_at = NOW()
        WHERE id = $8
      `,
      [next.title, next.description, next.projectId, next.assignedTo, next.status, next.priority, next.dueDate, req.params.id]
    );
    res.json({ task: await taskWithRelations(req.params.id) });
  })
);

router.delete('/:id', roleMiddleware('admin'), [param('id').isUUID(), validate], asyncHandler(async (req, res) => {
  const { rowCount } = await query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ message: 'Task not found' });
  res.json({ message: 'Task deleted' });
}));

async function ensureProjectExists(projectId) {
  const { rows } = await query('SELECT id FROM projects WHERE id = $1', [projectId]);
  if (!rows[0]) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }
}

async function ensureProjectMember(projectId, userId) {
  const { rows } = await query('SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, userId]);
  if (!rows[0]) {
    const error = new Error('Assignee must be a project member');
    error.status = 422;
    throw error;
  }
}

async function ensureTaskAccess(task, user) {
  if (user.role === 'admin') return true;
  const { rows } = await query('SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2', [task.projectId, user.id]);
  if (!rows[0]) {
    const error = new Error('Task access denied');
    error.status = 403;
    throw error;
  }
  return true;
}

async function taskWithRelations(id) {
  const { rows } = await query(
    `
      SELECT t.*, p.name AS project_name, u.name AS assignee_name, u.email AS assignee_email
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.id = $1
    `,
    [id]
  );
  return rows[0] ? formatTask(rows[0]) : null;
}

function formatTask(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    projectId: task.project_id,
    projectName: task.project_name,
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
