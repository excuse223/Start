# Work Hours Tracker - Backend

Backend API with authentication, user roles, and work hours tracking.

## Features

- 🔐 JWT Authentication
- 👥 User Roles (Admin, Manager, Employee)
- 📊 Work Hours Tracking
- 💰 Cost Calculation
- 📈 Reports

## Quick Start (GitHub Codespaces)

### 1. Setup

```bash
cd backend
chmod +x setup.sh
./setup.sh
```

### 2. Start Server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Server runs on `http://localhost:8000`

### 3. Test Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Login with username/password | No |
| GET | `/api/auth/me` | Get current user info | Yes |
| POST | `/api/auth/logout` | Logout | Yes |
| POST | `/api/auth/change-password` | Change password | Yes |

### Employees

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List employees |
| GET | `/api/employees/:id` | Get employee |
| POST | `/api/employees` | Create employee |
| PUT | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Delete employee |

### Work Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/work-logs` | List work logs |
| GET | `/api/work-logs/:id` | Get work log |
| POST | `/api/work-logs` | Create work log |
| PUT | `/api/work-logs/:id` | Update work log |
| DELETE | `/api/work-logs/:id` | Delete work log |

## User Roles

### Admin 👑
- Full access to everything
- Can manage all employees
- Can see hourly rates and costs
- Can create users

### Manager 👔
- Can only see assigned employees
- Can manage work logs for assigned employees

### Employee 👤
- Can only see own data
- Can add own work logs

## Environment Variables

Create a `.env` file (copy from `.env.example`):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/work_hours_db
PORT=8000
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d
ALGORITHM=HS256
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123
```

## Testing

### Run Tests

```bash
cd backend
python -m pytest tests/ -v
```

### Test Health Check

```bash
curl http://localhost:8000/health
```

**Expected:**
```json
{"status": "healthy"}
```

### Test Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

**Expected:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "employee_id": null
  }
}
```

### Test Protected Endpoint

```bash
TOKEN="your-token-here"

curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Test Change Password

```bash
TOKEN="your-token-here"

curl -X POST http://localhost:8000/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword": "admin123", "newPassword": "newpassword456"}'
```

## Default Credentials

```
Username: admin
Password: admin123
```

⚠️ **Change password immediately after first login!**

## Troubleshooting

### Database Connection Error

```bash
# Start PostgreSQL
sudo service postgresql start

# Recreate database
bash scripts/setup-db.sh
```

### Admin User Not Created

```bash
python init_db.py
```

## Project Structure

```
backend/
├── app/
│   ├── middleware/
│   │   └── auth.py              # JWT authentication
│   ├── models/
│   │   ├── user.py
│   │   ├── employee.py
│   │   └── work_log.py
│   ├── routes/
│   │   ├── auth.py              # Auth endpoints
│   │   ├── employees.py         # Employee CRUD
│   │   ├── work_logs.py         # Work logs CRUD
│   │   └── reports.py           # Reports
│   ├── database.py              # Database connection
│   └── main.py                  # FastAPI app
├── scripts/
│   └── setup-db.sh              # Database setup
├── tests/
│   ├── test_api.py
│   ├── test_auth.py
│   └── test_trailing_slash.py
├── schema.sql                   # Database schema
├── init_db.py                   # Initialize admin user
├── requirements.txt             # Python dependencies
├── setup.sh                     # Setup script
└── .env.example                 # Environment template
```

## Security

- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens with expiry
- ✅ Role-based access control
- ✅ SQL injection prevention (parameterized queries via SQLAlchemy)
- ⚠️ Change `JWT_SECRET` in production
- ⚠️ Use HTTPS in production
- ⚠️ Change default admin password
