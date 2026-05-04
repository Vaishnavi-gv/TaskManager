# Team Task Manager

Full-stack web app for **projects**, **team members**, and **tasks** with **role-based access** (Admin / Member per project), a **dashboard** (totals, overdue, recent activity), and **JWT authentication**.

**Stack:** React (Vite) · Node.js · Express · MongoDB (Mongoose)

## Live demo

Deploy to **Railway** (or any Node host) and set the environment variables below. Your **Live URL** is the public URL of the service that runs `npm start` (single service can serve the API and the built React app).

## Features

- **Auth:** Register, login, JWT sessions, protected API routes
- **Projects:** Create projects; creator is **admin**; list projects with per-project task stats and overdue count
- **Team:** Admins invite members by **email**, set **admin** or **member**, remove members (owner cannot be removed)
- **Tasks:** Create, filter (status / overdue), assign to members, set priority, due date, status (`todo` | `in_progress` | `done` | `blocked`)
- **RBAC:** Admins can manage project settings, members, and all tasks. Members can edit tasks they **created** or are **assigned** to; only admins or the **creator** can delete a task
- **Dashboard:** Cross-project summary, overdue count, “assigned to you” open tasks, recent activity

## Repository layout

| Path        | Description                          |
| ----------- | ------------------------------------ |
| `client/`   | React SPA (Vite + Tailwind CSS)      |
| `server/`   | Express REST API + MongoDB           |
| `package.json` (root) | `build` and `start` for deployment |

## Local development

**Prerequisites:** Node.js 18+, MongoDB (local or [Atlas](https://www.mongodb.com/cloud/atlas))

1. **Clone and install**

   ```bash
   git clone <your-repo-url>
   cd TaskManager
   cp .env.example .env
   ```

2. **Configure `.env` in the project root** (or only `server/` if you prefer; the server loads `dotenv` from the current working directory—see note below)

   - `MONGODB_URI` – MongoDB connection string  
   - `JWT_SECRET` – long random string for signing tokens  

   For local dev, the Vite dev server proxies `/api` to `http://localhost:4000` (see `client/vite.config.js`).

3. **Run MongoDB** (if local) and start the API:

   ```bash
   cd server
   # from server folder, or set env in shell:
   set MONGODB_URI=...   # Windows cmd
   set JWT_SECRET=...
   node src/index.js
   ```

4. **Start the React app** (separate terminal):

   ```bash
   cd client
   npm run dev
   ```

   Open `http://localhost:5173`. The UI calls `/api`, which is proxied to the Express app on port 4000.

> **Note:** `dotenv` loads `.env` from the **current working directory**. If you start the server with `cd server && node src/index.js`, place `.env` in `server/` or export variables in the shell. The root `npm start` runs from the repo root, so a `.env` in the **repository root** is appropriate for production-style local runs.

## Production build (same as CI / Railway)

From the **repository root**:

```bash
npm run build
npm start
```

This installs client dependencies, builds `client/dist`, installs server dependencies, and starts Express. The server serves the React build and the API (see `server/src/index.js`).

## Deploy on Railway

1. Create a **new project** and add a **MongoDB** service (or use **MongoDB Atlas** and copy the connection string).
2. Add a **Node** service from this GitHub repo.
3. **Build command:** `npm run build` (or leave empty if Nixpacks runs `npm install` + `npm run build` from `package.json`).
4. **Start command:** `npm start`
5. **Variables** (in the Node service):

   | Variable        | Value |
   | --------------- | ----- |
   | `MONGODB_URI`   | From Railway MongoDB plugin or Atlas |
   | `JWT_SECRET`    | Long random string (e.g. `openssl rand -hex 32`) |
   | `PORT`          | Usually set automatically by Railway |

6. **Root directory:** repository root (where this `README` lives).

If the browser and API share the same origin (one Railway URL), you do not need `CLIENT_ORIGIN`. If you split frontend and backend later, set `CLIENT_ORIGIN` to the frontend URL for CORS.

## API overview

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/api/auth/register` | Register `{ name, email, password }` |
| `POST` | `/api/auth/login` | Login `{ email, password }` |
| `GET`  | `/api/auth/me` | Current user (Bearer token) |
| `GET`  | `/api/users/search?q=` | Search users by name/email (for future UX) |
| `GET`  | `/api/dashboard` | Dashboard summary + recent tasks |
| `GET`  | `/api/projects` | List my projects + stats |
| `POST` | `/api/projects` | Create project |
| `GET`  | `/api/projects/:id` | Project + members |
| `PATCH`| `/api/projects/:id` | Update project (admin) |
| `DELETE`| `/api/projects/:id` | Delete project (admin) |
| `POST` | `/api/projects/:id/members` | Add member `{ email, role? }` (admin) |
| `PATCH`| `/api/projects/:id/members/:userId` | Change role (admin) |
| `DELETE`| `/api/projects/:id/members/:userId` | Remove member (admin) |
| `GET`  | `/api/projects/:projectId/tasks` | List tasks (`status`, `overdue`) |
| `POST` | `/api/projects/:projectId/tasks` | Create task |
| `PATCH`| `/api/projects/:projectId/tasks/:taskId` | Update task |
| `DELETE`| `/api/projects/:projectId/tasks/:taskId` | Delete task |
| `GET`  | `/api/health` | Health check |

## Submission checklist (assignment)

- [ ] **Live URL** – Railway (or other) public URL  
- [ ] **GitHub repo** – push this project  
- [ ] **README** – this file  
- [ ] **2–5 min demo video** – walk through signup, project, members, tasks, dashboard  

## License

MIT — use freely for your portfolio and coursework.
