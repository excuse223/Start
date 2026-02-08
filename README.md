# Work Hours Management System

A complete web application for managing and tracking employee work hours, built with FastAPI (backend), React.js (frontend), and PostgreSQL database, all containerized with Docker.

> 📚 **[Pełny przewodnik z komendami / Full command guide →](QUICK_START.md)**

## 🚀 Features

- **Employee Management**: Add, edit, view, and delete employee records
  - Email field is optional for employees
  - Track first name and last name separately
- **Work Log Tracking**: Record daily work hours with multiple categories:
  - Regular work hours
  - Overtime hours
  - Vacation hours
  - Sick leave hours
  - Other hours
- **Validation**: Automatic warning when daily hours exceed 12 hours
- **Reports**: 
  - Manager reports (hours only, no financial data)
  - Owner reports (with full financial data and costs)
  - Export to PDF
- **Interactive Dashboard**: Visual overview with charts and statistics
- **Multi-Language Support**: 🇵🇱 Polish and 🇬🇧 English interface
  - Default language: Polish
  - Easy language switching via sidebar buttons
  - Language preference saved automatically
- **Role-Based Access**: Separate views for managers and owners
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🛠️ Technologies

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **PostgreSQL** - Relational database
- **Alembic** - Database migrations
- **ReportLab** - PDF generation
- **Pydantic** - Data validation

### Frontend
- **React.js** - UI library
- **React Router** - Client-side routing
- **Chart.js** - Data visualization
- **Axios** - HTTP client
- **i18next** - Internationalization framework
- **react-i18next** - React bindings for i18next

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Web server for frontend

## 📋 Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

## 🚀 Quick Start

> 📖 **Więcej komend i szczegółów → [QUICK_START.md](QUICK_START.md)**  
> 📖 **More commands and details → [QUICK_START.md](QUICK_START.md)**

### 1. Clone the Repository

```bash
git clone https://github.com/excuse223/Start.git
cd Start
```

### 2. Start the Application

```bash
docker-compose up -d --build
```

This command will:
- Build the backend, frontend, and database containers
- Start all services
- Create the database schema

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432

## 📦 Project Structure

```
Start/
├── backend/
│   ├── app/
│   │   ├── models/         # Database models (Employee, WorkLog, User, Role)
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic (PDF generation)
│   │   ├── database.py     # Database configuration
│   │   └── main.py         # FastAPI application
│   ├── alembic/            # Database migrations
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.jsx         # Main application
│   │   ├── App.css         # Styles
│   │   └── index.js        # Entry point
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 🔧 Configuration

### Backend Environment Variables

Copy `.env.example` to `.env` in the backend directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL=postgresql://admin:secure_password@postgres:5432/work_hours_db
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend Environment Variables

Copy `.env.example` to `.env` in the frontend directory:

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:

```env
REACT_APP_API_URL=http://localhost:8000
```

## 💾 Database Migrations

### Apply Migrations

```bash
docker-compose exec backend alembic upgrade head
```

### Create New Migration

```bash
docker-compose exec backend alembic revision --autogenerate -m "description of changes"
```

### Rollback Migration

```bash
docker-compose exec backend alembic downgrade -1
```

## 💾 Database Backup & Restore

### Create Backup

```bash
docker-compose exec postgres pg_dump -U admin work_hours_db > backup.sql
```

### Restore from Backup

```bash
docker-compose exec -T postgres psql -U admin work_hours_db < backup.sql
```

## 📖 Usage Guide

### Adding an Employee

1. Navigate to the "Employees" page
2. Click "Add New Employee"
3. Fill in the employee details:
   - **First Name** (required)
   - **Last Name** (required)
   - **Email** (optional - can be left empty)
4. Click "Save"

**Note**: Email address is optional and can be left empty for employees who don't have one.

### Recording Work Hours

1. Navigate to the "Dashboard" page
2. Click "Add Work Log"
3. Select an employee from the dropdown
4. Choose the work date
5. Enter hours for each category:
   - Work hours (regular hours)
   - Overtime hours
   - Vacation hours
   - Sick leave hours
   - Other hours
6. Add optional notes
7. Click "Save"

**Note**: If total hours exceed 12, you'll see a warning but can still save.

### Changing Language / Zmiana Języka

The application supports Polish and English languages:

1. Look for the language switcher in the sidebar (top section)
2. Click 🇵🇱 **PL** for Polish (Polski)
3. Click 🇬🇧 **EN** for English
4. Your language preference is automatically saved

**Default Language**: Polish (Polski)

---

Aplikacja obsługuje języki polski i angielski:

1. Znajdź przełącznik języka na pasku bocznym (górna sekcja)
2. Kliknij 🇵🇱 **PL** dla języka polskiego
3. Kliknij 🇬🇧 **EN** dla języka angielskiego
4. Twój wybór języka jest automatycznie zapisywany

**Domyślny język**: Polski

### Generating Reports

1. Navigate to the "Reports" page
2. Select an employee
3. Choose date range (start and end dates)
4. Select report type:
   - **Manager Report**: Shows only hours (no financial data)
   - **Owner Report**: Shows hours and costs (requires hourly rate)
5. Choose format (JSON or PDF)
6. Click "Generate Report"

### Report Types

#### Manager Report
- Work hours breakdown by category
- Totals for the period
- **No financial information**

#### Owner Report
- Work hours breakdown by category
- Hourly rates and overtime multipliers
- Cost breakdown by category
- Total costs for the period

## 🔍 API Endpoints

### Employees

- `GET /api/employees` - List all employees
- `GET /api/employees/{id}` - Get employee details
- `POST /api/employees` - Create new employee
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee

### Work Logs

- `GET /api/work-logs` - List work logs (with filters)
- `GET /api/work-logs/{id}` - Get work log details
- `POST /api/work-logs` - Create new work log
- `PUT /api/work-logs/{id}` - Update work log
- `DELETE /api/work-logs/{id}` - Delete work log

### Reports

- `GET /api/reports/manager/{employee_id}` - Manager report
- `GET /api/reports/owner/{employee_id}` - Owner report

Query parameters:
- `start_date` (required): Start date (YYYY-MM-DD)
- `end_date` (required): End date (YYYY-MM-DD)
- `format` (optional): "json" or "pdf" (default: "json")
- `hourly_rate` (owner report only): Hourly rate (default: 25.0)
- `overtime_multiplier` (owner report only): Overtime multiplier (default: 1.5)

## 🐛 Troubleshooting

### Check Container Status

```bash
docker-compose ps
```

### View Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Common Issues

#### Port Already in Use

If ports 3000, 8000, or 5432 are already in use, edit `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "3001:80"  # Change 3000 to 3001
  backend:
    ports:
      - "8001:8000"  # Change 8000 to 8001
  postgres:
    ports:
      - "5433:5432"  # Change 5432 to 5433
```

#### Database Connection Issues

Check if PostgreSQL is ready:

```bash
docker-compose exec postgres pg_isready -U admin
```

#### Frontend Can't Connect to Backend

Check backend health:

```bash
curl http://localhost:8000/health
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
pip install pytest pytest-asyncio httpx
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 🔒 Security Considerations

- Change default passwords in production
- Use environment variables for sensitive data
- Enable HTTPS in production
- Implement authentication and authorization
- Regular security updates
- Database backups

## 📝 Development

### Running Backend Locally

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Running Frontend Locally

```bash
cd frontend
npm install
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 👥 Authors

- **excuse223** - Initial work

## 🙏 Acknowledgments

- FastAPI documentation
- React.js community
- Chart.js team
- ReportLab developers

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting section

---

**Ready to deploy on TrueNAS SCALE**: Simply run `docker-compose up -d --build` and the application will be fully operational!