# Track It

Track It is a full-stack team task manager with a themeable, Linear-inspired interface, JWT authentication, role-based access, project membership, kanban project boards, task lists, admin user management, toast notifications, modals, and Railway-ready deployment.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router
- Backend: Node.js, Express, PostgreSQL
- Auth: JWT access tokens and revocable refresh tokens
- Deployment: Railway with Nixpacks or Procfile

## Features

- Login, registration, logout, access-token refresh, and protected routes
- Admin-only project creation, editing, deletion, member management, task creation, and user role changes
- Member access scoped to assigned projects and status-only task updates
- Dashboard stats, recent tasks, and upcoming deadlines
- Project grid, project detail header, filters, and 4-column kanban board
- My Tasks page grouped into Today, This Week, and Later
- All Tasks page with search, filters, status updates, and admin deletion
- PostgreSQL schema initializer and seed script

## Local Setup

1. Install dependencies:

   ```bash
   npm install --prefix server
   npm install --prefix client
   ```

2. Create `server/.env` from `server/.env.example`:

   ```env
   PORT=5000
   DATABASE_URL=postgresql://user:password@localhost:5432/taskflow
   JWT_SECRET=replace_me
   JWT_REFRESH_SECRET=replace_me_too
   CLIENT_URL=http://localhost:5173
   ```

3. Seed the database:

   ```bash
   npm --prefix server run seed
   ```

4. Run the app locally in two terminals:

   ```bash
   npm --prefix server run dev
   npm --prefix client run dev
   ```

5. Sign in with seeded accounts:

   - Admin: `admin@test.com` / `Admin@123`
   - Member 1: `member1@test.com` / `Member@123`
   - Member 2: `member2@test.com` / `Member@123`

## API Endpoints

| Area | Method | Endpoint | Access |
| --- | --- | --- | --- |
| Auth | POST | `/api/auth/register` | Public |
| Auth | POST | `/api/auth/login` | Public |
| Auth | POST | `/api/auth/refresh` | Public |
| Auth | POST | `/api/auth/logout` | Protected |
| Auth | GET | `/api/auth/me` | Protected |
| Projects | POST | `/api/projects` | Admin |
| Projects | GET | `/api/projects` | Protected |
| Projects | GET | `/api/projects/:id` | Project member/Admin |
| Projects | PUT | `/api/projects/:id` | Admin |
| Projects | DELETE | `/api/projects/:id` | Admin |
| Projects | POST | `/api/projects/:id/members` | Admin |
| Projects | DELETE | `/api/projects/:id/members/:userId` | Admin |
| Tasks | POST | `/api/tasks` | Admin |
| Tasks | GET | `/api/tasks` | Protected |
| Tasks | GET | `/api/tasks/my-tasks` | Protected |
| Tasks | GET | `/api/tasks/:id` | Project member/Admin |
| Tasks | PUT | `/api/tasks/:id` | Admin all fields, member status only |
| Tasks | DELETE | `/api/tasks/:id` | Admin |
| Users | GET | `/api/users` | Admin |
| Users | PUT | `/api/users/:id/role` | Admin |

## Railway Deployment

1. Create a Railway project and add a PostgreSQL database.
2. Set these environment variables on the web service:

   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=your_secure_access_secret
   JWT_REFRESH_SECRET=your_secure_refresh_secret
   CLIENT_URL=https://your-railway-app.up.railway.app
   NODE_ENV=production
   ```

3. Deploy from the repository. `nixpacks.toml` installs server/client dependencies, builds the Vite frontend, and starts the Express server.
4. Run the seed command once from a Railway shell if demo data is needed:

   ```bash
   npm --prefix server run seed
   ```

## Screenshots

- Dashboard screenshot: add `docs/screenshots/dashboard.png`
- Project board screenshot: add `docs/screenshots/project-board.png`
- Admin users screenshot: add `docs/screenshots/admin-users.png`

## Demo Video

Demo video link: add your hosted walkthrough URL here after recording.
