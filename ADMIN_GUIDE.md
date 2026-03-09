# Admin Guide - Work Hours Management System

## Table of Contents
1. [Initial Setup](#setup)
2. [User Management Best Practices](#users)
3. [Backup Configuration Guide](#backup-config)
4. [Security Recommendations](#security)
5. [Monitoring and Maintenance](#monitoring)
6. [Troubleshooting](#troubleshooting)

---

## 1. Initial Setup {#setup}

### Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost/worklog_db

# JWT Authentication
JWT_SECRET=<minimum-32-character-secret-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Backups
LOCAL_BACKUP_PATH=/var/backups/worklog
BACKUP_RETENTION_DAYS=30

# Remote Backup (optional)
REMOTE_ENABLED=false
REMOTE_TYPE=sftp
REMOTE_HOST=backup.example.com
REMOTE_PORT=22
REMOTE_USER=backup_user
REMOTE_PATH=/backups/worklog

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=your-smtp-password
```

### Running with Docker

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- FastAPI backend (port 8000)
- React frontend (port 3000 or via nginx)

### Creating the First Admin User

After first run, use `init_db.py` to seed the database with an admin account, or use the API:

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "secure-password", "role": "admin"}'
```

---

## 2. User Management Best Practices {#users}

### Role Hierarchy
- **Admin**: Full access to all features including user management, backups, audit logs, settings
- **Manager**: Can manage their assigned employees, create/edit projects, view reports
- **Employee**: Can view their own work logs and calendar

### Password Policy
- Minimum 12 characters recommended
- Use the built-in password generator (16-character secure passwords)
- Enforce password changes periodically via Settings > Security

### Linking Users to Employees
Always link user accounts to employee records where applicable. This enables:
- Personal calendar views
- Self-service work log viewing
- Correct permissions for managers

---

## 3. Backup Configuration Guide {#backup-config}

### Local Backups
Configure in **Settings > Backups** or via environment variables:
- `LOCAL_BACKUP_PATH`: Where to store backup files (default: `/tmp/backups`)
- `BACKUP_RETENTION_DAYS`: How many days to keep backups (default: 30)

### SFTP Remote Backup
```bash
REMOTE_ENABLED=true
REMOTE_TYPE=sftp
REMOTE_HOST=backup.example.com
REMOTE_PORT=22
REMOTE_USER=backup_user
REMOTE_PASSWORD=secure-password
# OR use SSH key:
REMOTE_SSH_KEY_PATH=/path/to/id_rsa
REMOTE_PATH=/backups/worklog
```

### S3 / MinIO Remote Backup
```bash
REMOTE_ENABLED=true
REMOTE_TYPE=s3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=us-east-1
S3_BUCKET=worklog-backups
# For MinIO or DigitalOcean Spaces:
S3_ENDPOINT_URL=https://minio.example.com
```

### Automated Backups
Daily backups run automatically at 2:00 AM UTC. Configure with APScheduler in `backend/app/tasks/backup_tasks.py`.

---

## 4. Security Recommendations {#security}

### HTTPS
Always use HTTPS in production. Set `FORCE_HTTPS=true` and configure nginx/reverse proxy with SSL certificates.

### JWT Secret
Use a cryptographically random secret of at least 32 characters:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Rate Limiting
The API has rate limiting enabled via slowapi. Default limits:
- Login endpoint: 10 requests/minute per IP
- General API: 100 requests/minute per IP

### CORS
In production, set `ALLOWED_ORIGINS` to only your frontend domain:
```bash
ALLOWED_ORIGINS=https://app.example.com
```

### Audit Logs
All admin actions are logged. Review **📋 Audit Logs** regularly to detect unauthorized changes.

---

## 5. Monitoring and Maintenance {#monitoring}

### Health Check
```bash
curl http://localhost:8000/health
# Returns: {"status": "healthy"}
```

### Database Maintenance
Run VACUUM ANALYZE periodically:
```sql
VACUUM ANALYZE;
```

### Log Files
Application logs are output to stdout by default. Use Docker logging or redirect to file:
```bash
docker-compose logs -f backend
```

### Backup Verification
Regularly test backup restoration in a staging environment to ensure backups are valid.

---

## 6. Troubleshooting {#troubleshooting}

### Login Issues
- Check `JWT_SECRET` is consistent across restarts
- Verify database connectivity
- Check rate limiting if getting 429 errors

### Database Connection Errors
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
- Ensure PostgreSQL is running: `pg_isready -h localhost`
- Check firewall rules

### Backup Failures
- Check disk space: `df -h /var/backups`
- Verify `pg_dump` is installed: `which pg_dump`
- Check SFTP/S3 credentials and connectivity

### High Memory/CPU Usage
- Review slow queries with `EXPLAIN ANALYZE`
- Check for large work log exports
- Consider Redis caching for reports

### Frontend Build Issues
```bash
cd frontend
npm install
npm run build
```
