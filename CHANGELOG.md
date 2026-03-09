# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security
- Remove hardcoded `POSTGRES_PASSWORD` and `DATABASE_URL` secrets from `docker-compose.yml`; replaced with `${VARIABLE}` references loaded from a `.env` file
- Stop exposing PostgreSQL (5432) and Redis (6379) ports to the host; services are now only accessible within the Docker network
- Remove `--reload` flag from backend Dockerfile CMD (development-only flag)
- Add security headers to `frontend/nginx.conf`: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Content-Security-Policy`
- Add `client_max_body_size 10m` to nginx to limit upload size
- Add `frontend/.env.development` and `frontend/.env.production` to `.gitignore`

### Added
- `LICENSE` file (MIT License, copyright excuse223)
- `.env.example` in repo root with placeholder values for docker-compose
- `.github/workflows/ci.yml` — GitHub Actions CI with backend (pytest) and frontend (build + test) jobs
- `backend/requirements-dev.txt` — separate dev/test dependencies
- `CHANGELOG.md` — this file

### Changed
- `docker-compose.yml`: add `restart: unless-stopped` to all services; add healthchecks for backend and frontend
- `backend/requirements.txt`: remove test-only packages (`pytest`, `pytest-asyncio`, `httpx`)
- `frontend/README.md`: fix license section to reflect MIT License

## [1.0.0] - 2026-03-09

### Added
- Employee management (CRUD, hourly rates, manager assignment)
- Work log tracking with daily entries and overtime calculation
- Reports for managers and owners (PDF/Excel export)
- JWT-based authentication with role-based access control (admin, manager, employee)
- Full internationalisation — Polish and English (i18n with i18next)
- Docker Compose deployment (PostgreSQL 15, Redis 7, FastAPI backend, React frontend via Nginx)
- Automated backup system with local and remote (S3/SFTP) support
- Audit log — records all significant user and system actions
- Calendar view for work entries
- Notifications system
- Global search across employees, work logs and projects
- Projects management
- Dark mode support in the frontend
- Alembic database migrations (versions 001–004)
- Rate limiting (slowapi) and security middleware
