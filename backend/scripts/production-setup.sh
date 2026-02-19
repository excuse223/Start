#!/bin/bash
# =============================================================================
# Production Setup Script — Work Hours Tracker
# Tested on Ubuntu 22.04 LTS
# Run as root: sudo bash scripts/production-setup.sh
# =============================================================================
set -euo pipefail

APP_NAME="work-hours-tracker"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="/var/log/${APP_NAME}"
BACKUP_DIR="/var/backups/${APP_NAME}"
DB_NAME="work_hours_db"
DB_USER="work_hours_user"
ENV_FILE="${APP_DIR}/.env.production"

echo "=============================="
echo " Work Hours Tracker — Setup"
echo "=============================="

# --- Generate secrets ---
JWT_SECRET=$(openssl rand -hex 32)       # 64-char hex = 256-bit
DB_PASSWORD=$(openssl rand -hex 8)       # 16-char hex
ADMIN_PASSWORD=$(openssl rand -base64 12 | tr -dc 'A-Za-z0-9' | head -c 16)

echo "[1/9] Secrets generated"

# --- PostgreSQL setup ---
if command -v psql &>/dev/null; then
    echo "[2/9] Configuring PostgreSQL..."
    sudo -u postgres psql <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;
SQL
    # Create database if it does not exist
    if ! sudo -u postgres psql -lqt | cut -d'|' -f1 | grep -qw "${DB_NAME}"; then
        sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
    fi
    sudo -u postgres psql -d "${DB_NAME}" <<SQL
GRANT USAGE ON SCHEMA public TO ${DB_USER};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${DB_USER};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${DB_USER};
SQL
else
    echo "[2/9] PostgreSQL not found — skipping DB setup (configure manually)"
    DB_PASSWORD="CHANGE_ME_$(openssl rand -hex 4)"
fi

# --- Create .env.production ---
echo "[3/9] Writing ${ENV_FILE}..."
cat > "${ENV_FILE}" <<EOF
NODE_ENV=production
APP_ENV=production
PORT=8000
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
ALGORITHM=HS256
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=${ADMIN_PASSWORD}
ALLOWED_ORIGINS=yourdomain.com,www.yourdomain.com
LOG_LEVEL=info
LOG_FILE_PATH=${LOG_DIR}
BACKUP_DIR=${BACKUP_DIR}
BACKUP_RETENTION_DAYS=7
BACKUP_REMOTE_ENABLED=false
FORCE_HTTPS=true
EOF
chmod 600 "${ENV_FILE}"

# --- Create directories ---
echo "[4/9] Creating log and backup directories..."
mkdir -p "${LOG_DIR}" "${BACKUP_DIR}"
# If the app runs as a dedicated user, adjust ownership:
# chown appuser:appuser "${LOG_DIR}" "${BACKUP_DIR}"

# --- Install Python dependencies ---
echo "[5/9] Installing Python dependencies..."
cd "${APP_DIR}"
pip install -r requirements.txt

# --- Run database migrations ---
echo "[6/9] Running database migrations..."
if [ -f "${APP_DIR}/alembic.ini" ]; then
    APP_ENV=production DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}" \
        alembic upgrade head || echo "Migration failed (DB may not be ready yet)"
fi

# --- Create admin user ---
echo "[7/9] Initialising database (admin user)..."
APP_ENV=production \
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}" \
DEFAULT_ADMIN_PASSWORD="${ADMIN_PASSWORD}" \
    python "${APP_DIR}/init_db.py" || echo "init_db failed (DB may not be ready yet)"

# --- Firewall ---
echo "[8/9] Configuring UFW firewall..."
if command -v ufw &>/dev/null; then
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp   comment "SSH"
    ufw allow 80/tcp   comment "HTTP"
    ufw allow 443/tcp  comment "HTTPS"
    ufw --force enable
    echo "UFW enabled (ports 22, 80, 443 open)"
else
    echo "ufw not found — configure firewall manually"
fi

# --- Cron job for daily backups at 02:00 AM ---
echo "[9/9] Setting up daily backup cron job..."
CRON_JOB="0 2 * * * cd ${APP_DIR} && APP_ENV=production python scripts/backup.py >> ${LOG_DIR}/backup.log 2>&1"
( crontab -l 2>/dev/null | grep -v "backup.py"; echo "${CRON_JOB}" ) | crontab -
echo "Cron job installed (daily at 02:00 AM)"

# --- Summary ---
echo ""
echo "=============================="
echo " Setup Complete!"
echo "=============================="
echo ""
echo "Generated credentials (save these securely):"
echo "  Admin username : admin"
echo "  Admin password : ${ADMIN_PASSWORD}"
echo "  DB user        : ${DB_USER}"
echo "  DB password    : ${DB_PASSWORD}"
echo "  JWT secret     : ${JWT_SECRET}"
echo ""
echo "Next steps:"
echo "  1. Update ALLOWED_ORIGINS in ${ENV_FILE}"
echo "  2. Install Nginx and SSL: sudo certbot --nginx -d yourdomain.com"
echo "  3. Start app:  APP_ENV=production uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo "  4. Or with PM2: npm install -g pm2 && pm2 start 'uvicorn app.main:app' --name ${APP_NAME}"
echo ""
