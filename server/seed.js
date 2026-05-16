import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { initDb, pool, query } from './src/config/db.js';

dotenv.config();

const users = [
  { name: 'Admin User', email: 'admin@test.com', password: 'Admin@123', role: 'admin' },
  { name: 'Shubhi Tiwari', email: 'member1@test.com', password: 'Member@123', role: 'member' },
  { name: 'Noah Patel', email: 'member2@test.com', password: 'Member@123', role: 'member' }
];

async function upsertUser(user) {
  const passwordHash = await bcrypt.hash(user.password, 12);
  const { rows } = await query(
    `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email)
      DO UPDATE SET name = EXCLUDED.name, password = EXCLUDED.password, role = EXCLUDED.role
      RETURNING id, name, email, role
    `,
    [user.name, user.email, passwordHash, user.role]
  );
  return rows[0];
}

async function upsertProject(name, description, createdBy) {
  const existing = await query('SELECT * FROM projects WHERE name = $1 LIMIT 1', [name]);
  if (existing.rows[0]) return existing.rows[0];
  const { rows } = await query(
    'INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
    [name, description, createdBy]
  );
  return rows[0];
}

async function addMember(projectId, userId, role = 'member') {
  await query('INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [
    projectId,
    userId,
    role
  ]);
}

async function addTask(task) {
  const existing = await query('SELECT id FROM tasks WHERE title = $1 AND project_id = $2 LIMIT 1', [task.title, task.projectId]);
  if (existing.rows[0]) return;
  await query(
    `
      INSERT INTO tasks (title, description, project_id, assigned_to, created_by, status, priority, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [task.title, task.description, task.projectId, task.assignedTo, task.createdBy, task.status, task.priority, task.dueDate]
  );
}

async function seed() {
  await initDb();
  const [admin, member1, member2] = await Promise.all(users.map(upsertUser));

  const design = await upsertProject('Design System Refresh', 'Unify task surfaces with a sharper, calmer product design language.', admin.id);
  const launch = await upsertProject('Mobile Launch Plan', 'Coordinate launch readiness, release tasks, and handoff ownership for mobile.', admin.id);

  await Promise.all([
    addMember(design.id, admin.id, 'owner'),
    addMember(design.id, member1.id),
    addMember(design.id, member2.id),
    addMember(launch.id, admin.id, 'owner'),
    addMember(launch.id, member1.id),
    addMember(launch.id, member2.id)
  ]);

  const today = new Date();
  const date = (offset) => {
    const value = new Date(today);
    value.setDate(value.getDate() + offset);
    return value.toISOString().slice(0, 10);
  };

  await Promise.all([
    addTask({
      title: 'Audit sidebar navigation states',
      description: 'Review active, hover, and collapsed sidebar behaviors across breakpoints.',
      projectId: design.id,
      assignedTo: member1.id,
      createdBy: admin.id,
      status: 'todo',
      priority: 'high',
      dueDate: date(0)
    }),
    addTask({
      title: 'Ship priority badge polish',
      description: 'Tune badge contrast and border opacity for accessibility.',
      projectId: design.id,
      assignedTo: member2.id,
      createdBy: admin.id,
      status: 'in_progress',
      priority: 'medium',
      dueDate: date(3)
    }),
    addTask({
      title: 'Finalize project card layout',
      description: 'Lock grid behavior and avatar stack spacing.',
      projectId: design.id,
      assignedTo: member1.id,
      createdBy: admin.id,
      status: 'done',
      priority: 'low',
      dueDate: date(-2)
    }),
    addTask({
      title: 'Complete launch checklist',
      description: 'Confirm release notes, support scripts, and rollback ownership.',
      projectId: launch.id,
      assignedTo: member2.id,
      createdBy: admin.id,
      status: 'overdue',
      priority: 'high',
      dueDate: date(-1)
    }),
    addTask({
      title: 'Prepare stakeholder demo',
      description: 'Capture the walkthrough flow and final metrics for launch review.',
      projectId: launch.id,
      assignedTo: member1.id,
      createdBy: admin.id,
      status: 'todo',
      priority: 'medium',
      dueDate: date(6)
    })
  ]);

  console.log('Seed data ready');
  await pool.end();
}

seed().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
