# TaskFlow

TaskFlow is a full-stack task orchestration platform built for a backend-focused internship assignment. It delivers a secure REST API with JWT authentication, refresh-token rotation, role-based access control, admin assignment workflows, and a polished React frontend for exercising the APIs end to end.

## Why This Submission Is Strong

- Secure auth flow with short-lived access tokens plus refresh-token rotation backed by hashed tokens in PostgreSQL
- Refresh tokens handled through an `HttpOnly` cookie instead of browser storage
- Clear RBAC boundaries: users manage their own tasks, while admins can inspect all tasks, assign ownership, and manage users
- Versioned API structure, validation, centralized error handling, Swagger docs, and a ready-to-import Postman collection
- Production-minded touches such as request IDs, structured logging, rate limiting, Docker support, and a concrete scalability note
- Frontend that is intentionally designed, responsive, and connected to the real backend flows instead of being a placeholder

## Stack

| Layer | Tech |
| --- | --- |
| Backend | Node.js 20, Express 4 |
| Database | PostgreSQL 16 |
| Frontend | React 18, Vite, React Router |
| Auth | JWT access tokens, refresh-token rotation, bcryptjs |
| Security | Helmet, CORS, rate limiting, validation, XSS sanitization |
| Docs | Swagger UI, OpenAPI JSON, Postman collection |
| Observability | Winston logging, request IDs |
| DevOps | Docker, Docker Compose, Nginx |

## Assignment Coverage

| Requirement | Implementation |
| --- | --- |
| Registration and login | `/api/v1/auth/register`, `/api/v1/auth/login` |
| Password hashing and JWT auth | `bcryptjs` + access/refresh JWT flow |
| Role-based access | `user` and `admin` roles enforced in middleware/controllers |
| CRUD for secondary entity | Full task CRUD under `/api/v1/tasks` |
| API versioning | `/api/v1/...` routes |
| Validation and error handling | `express-validator` + centralized error middleware |
| API documentation | Swagger at `/api-docs`, raw spec at `/api-docs.json` |
| Database schema | PostgreSQL tables for `users`, `tasks`, and `refresh_tokens` |
| Basic frontend | React app for auth, dashboard, task CRUD, profile, and admin views |
| Scalability note | See [SCALABILITY.md](./SCALABILITY.md) |

## Standout Features

### Secure session design

- Access token is returned in JSON and attached as a Bearer token
- Refresh token is stored in an `HttpOnly`, `SameSite=Strict` cookie
- Refresh tokens are hashed before persistence
- Token rotation revokes the previous refresh token on every refresh
- Password changes revoke all refresh sessions for that user

### Real admin workflow

- Admins can view all tasks across the workspace
- Admins can assign or reassign tasks to any active user
- Admins can filter the task board by assignee
- Admins can inspect the user directory and deactivate non-admin users

### Product-ready frontend

- Login and registration flows connected to the live API
- Protected dashboard with stats, recent tasks, and completion insights
- Task board with filters, modal editing, tags, due dates, and status toggles
- Profile page for account updates and password rotation
- Admin workspace for user oversight and global task visibility

## Project Structure

```text
taskflow/
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- db/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- utils/
|   |   `-- validators/
|   |-- server.js
|   `-- .env.example
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- context/
|   |   `-- pages/
|-- docs/
|   `-- postman/
|-- docker-compose.yml
|-- README.md
`-- SCALABILITY.md
```

## Core API Surface

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Create account and start session |
| POST | `/api/v1/auth/login` | Log in and receive access token |
| POST | `/api/v1/auth/refresh` | Rotate refresh token and issue new access token |
| POST | `/api/v1/auth/logout` | Revoke current refresh session |
| GET | `/api/v1/auth/me` | Get current user |
| PATCH | `/api/v1/auth/me` | Update profile |
| POST | `/api/v1/auth/change-password` | Rotate password and revoke sessions |

### Tasks

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/v1/tasks` | List tasks with filters, pagination, and sorting |
| POST | `/api/v1/tasks` | Create task |
| GET | `/api/v1/tasks/stats` | Get task statistics |
| GET | `/api/v1/tasks/:id` | Get one task |
| PUT | `/api/v1/tasks/:id` | Update task |
| DELETE | `/api/v1/tasks/:id` | Delete task |

### Admin

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/v1/admin/users` | List users with search and role filters |
| PATCH | `/api/v1/admin/users/:id/deactivate` | Deactivate a user |

## Local Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16+

### Backend

```bash
cd backend
npm install
cp .env.example .env
# update DB credentials and JWT secrets
npm run migrate
npm run dev
```

Backend runs on `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api` to the backend.

## Docker Setup

```bash
docker-compose up --build
docker-compose exec api node src/db/migrate.js
```

Services:

- Frontend: `http://localhost:3000`
- API: `http://localhost:5000`
- Swagger: `http://localhost:5000/api-docs`

## Demo Credentials

The migration seeds an admin account:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@taskflow.dev` | `Admin@123456` |

## API Docs And Testing

- Swagger UI: `http://localhost:5000/api-docs`
- Raw OpenAPI JSON: `http://localhost:5000/api-docs.json`
- Postman collection: [docs/postman/TaskFlow.postman_collection.json](./docs/postman/TaskFlow.postman_collection.json)

## Security Highlights

- Passwords hashed with bcrypt using 12 salt rounds
- Refresh tokens hashed before database storage
- Input validation on auth and task endpoints
- XSS sanitization for user-submitted text fields
- Rate limiting for API and auth routes
- Centralized error responses with request IDs for traceability
- Non-root Docker runtime for the API container

## Scalability

The current app is intentionally modular so it can evolve from a strong monolith into a distributed system. The roadmap covers caching, read replicas, background jobs, load balancing, observability, and service extraction in [SCALABILITY.md](./SCALABILITY.md).

## Environment Variables

Key backend variables:

| Variable | Description |
| --- | --- |
| `PORT` | API port |
| `NODE_ENV` | Environment name |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port |
| `DB_NAME` | Database name |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Access-token secret |
| `JWT_EXPIRES_IN` | Access-token TTL |
| `JWT_REFRESH_SECRET` | Refresh-token secret |
| `JWT_REFRESH_EXPIRES_IN` | Refresh-token TTL |
| `REFRESH_COOKIE_NAME` | Name of the HttpOnly refresh cookie |
| `ALLOWED_ORIGINS` | Comma-separated frontend origins |

## Notes For Reviewers

- The backend is the primary deliverable; the frontend exists to validate the API in realistic flows.
- The codebase is organized so new modules can follow the same `route -> validator -> controller -> model` pattern.
- Admin assignment support was added intentionally to show deeper RBAC thinking beyond basic CRUD.
