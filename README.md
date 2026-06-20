# Personal Profile

Personal Profile is a full-stack personal site and learning workspace. It combines a public portfolio/blog, an owner-only admin console, a Go API backed by MySQL, and a Python Learning Coach agent service.

## Features

- Public personal homepage with profile, contact links, skills, timeline, projects, blog, and Daily notes.
- Notion-powered blog and Daily content, kept outside the product database.
- Admin console for profile, contacts, skills, site config, projects, timeline, and learning data.
- Go backend with Gin, GORM, MySQL, JWT authentication, and owner role checks.
- Learning workspace for goals, plans, tasks, progress logs, and AI-assisted plan generation.
- Python Agent service with FastAPI, LangGraph, DeepSeek-compatible chat, SSE streaming, and conversation history.
- Lightweight development harness under `docs/dev-harness` for stage planning, API/schema contracts, progress logs, and pitfalls.

## Tech Stack

- Frontend: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Ant Design, Zustand.
- Backend: Go, Gin, GORM, MySQL, JWT.
- Agent service: Python, FastAPI, LangGraph, LangChain OpenAI-compatible client, SSE.
- Content: Notion for blog and Daily entries.
- Deployment: Vercel for the frontend, Docker/Docker Compose for full-stack local orchestration.

## Repository Structure

```text
app/                    Next.js App Router pages and route handlers
components/             React UI, layout, blog, portfolio, admin, and shared components
lib/                    API clients, Notion integration, AI retrieval, stores, and utilities
backend/                Go API service
  cmd/server/           Go server entrypoint
  internal/             config, db, handler, middleware, model, repository, response
  migrations/           MySQL schema and seed SQL
  docs/api.md           Backend API notes and curl examples
agent-service/          Python Learning Coach service
docs/dev-harness/       Stage plan, contracts, progress log, pitfalls, and harness state
docs/superpowers/specs/ Design specs produced during feature planning
scripts/                Harness checks, evaluation scripts, and utility scripts
public/                 Static assets
```

## Prerequisites

- Node.js 20+ and npm.
- Go 1.22+.
- Python 3.9+ for the current agent-service code path.
- MySQL 8 or 9.
- Docker and Docker Compose if you want to run the full stack in containers.

## Environment Variables

Create local env files as needed. Keep real secrets out of git.

Frontend `.env.local`:

```bash
NEXT_PUBLIC_API_BASE=http://localhost:8080
NEXT_PUBLIC_AGENT_SERVICE_URL=http://localhost:8000
NOTION_TOKEN=your_notion_integration_token
NOTION_DATABASE_ID=your_blog_database_id
NOTION_DAILY_DATABASE_ID=your_daily_database_id
```

Go backend:

```bash
BACKEND_DB_DSN='pp_app:pp_dev_pwd@tcp(127.0.0.1:3306)/personal_profile?charset=utf8mb4&parseTime=True&loc=Local'
JWT_SECRET=dev-secret
AGENT_SERVICE_URL=http://localhost:8000
BACKEND_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Agent service:

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
AGENT_DB_DSN='mysql+pymysql://pp_app:pp_dev_pwd@127.0.0.1:3306/personal_profile?charset=utf8mb4'
BACKEND_URL=http://localhost:8080
```

## Local Development

Install frontend dependencies:

```bash
npm install
```

Start the Next.js frontend:

```bash
npm run dev
```

Start the Go backend:

```bash
cd backend
go run ./cmd/server
```

Start the Python agent service:

```bash
cd agent-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Open:

- Public site: http://localhost:3000
- Admin console: http://localhost:3000/admin/login
- Go API health check: http://localhost:8080/api/health
- Agent service health check: http://localhost:8000/health

## Database Setup

For local MySQL, create the database and app user:

```sql
CREATE DATABASE IF NOT EXISTS personal_profile
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'pp_app'@'localhost' IDENTIFIED BY 'pp_dev_pwd';
GRANT ALL PRIVILEGES ON personal_profile.* TO 'pp_app'@'localhost';
FLUSH PRIVILEGES;
```

Apply migrations and seed data from `backend/migrations`. Use utf8mb4 when loading SQL that contains Chinese text:

```bash
mysql -u pp_app -p --default-character-set=utf8mb4 personal_profile < backend/migrations/0001_init.sql
mysql -u pp_app -p --default-character-set=utf8mb4 personal_profile < backend/migrations/0002_sys_user.sql
mysql -u pp_app -p --default-character-set=utf8mb4 personal_profile < backend/migrations/seed_002_owner.sql
```

Additional feature migrations and seeds live in the same directory. Check `docs/dev-harness/schema.md` and `docs/dev-harness/progress-log.md` before applying only part of the set.

## Docker Compose

Run the full stack:

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key docker compose up --build
```

Services:

- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- Agent: http://localhost:8000
- MySQL: localhost:3306

## Useful Commands

```bash
npm run dev              # Start Next.js dev server
npm run build            # Build frontend
npm run type-check       # TypeScript check
npm run harness:check    # Validate lightweight harness consistency

cd backend && go test ./...
cd backend && go build ./...

cd agent-service && python3 -m py_compile app/main.py app/api/chat.py app/api/generate.py
```

## Development Workflow

This project uses a lightweight development harness:

- Read `docs/dev-harness/stage-plan.md`, `progress-log.md`, and `pitfalls.md` before development work.
- For backend or frontend contract changes, also read `api-contract.md` and `schema.md`.
- Freeze API and schema contracts before writing business handlers, models, or migrations.
- Keep Notion as the blog source of truth; do not migrate blog content into MySQL.
- Prefer small, verifiable loops and record reusable pitfalls when they appear.

Run the harness check after stage changes or contract changes:

```bash
npm run harness:check
```

## Content Notes

- Blog posts are read from the configured Notion blog database.
- Daily notes are read from the configured Notion Daily database.
- Public profile, contacts, skills, timeline, projects, and learning workspace data are managed through the Go backend and MySQL.

## License

MIT
