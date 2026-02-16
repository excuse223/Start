import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_trailing_slash.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def cleanup():
    """Clean up database after each test"""
    yield
    # Clean up tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

def test_employees_get_without_trailing_slash():
    """Test GET /api/employees without trailing slash"""
    response = client.get("/api/employees")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_employees_get_with_trailing_slash():
    """Test GET /api/employees/ with trailing slash"""
    response = client.get("/api/employees/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_employees_post_without_trailing_slash():
    """Test POST /api/employees without trailing slash"""
    employee_data = {
        "first_name": "Test",
        "last_name": "User",
        "email": "test@example.com"
    }
    response = client.post("/api/employees", json=employee_data)
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "Test"
    assert data["last_name"] == "User"

def test_employees_post_with_trailing_slash():
    """Test POST /api/employees/ with trailing slash"""
    employee_data = {
        "first_name": "Test2",
        "last_name": "User2",
        "email": "test2@example.com"
    }
    response = client.post("/api/employees/", json=employee_data)
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "Test2"
    assert data["last_name"] == "User2"

def test_work_logs_get_without_trailing_slash():
    """Test GET /api/work-logs without trailing slash"""
    response = client.get("/api/work-logs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_work_logs_get_with_trailing_slash():
    """Test GET /api/work-logs/ with trailing slash"""
    response = client.get("/api/work-logs/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_work_logs_post_without_trailing_slash():
    """Test POST /api/work-logs without trailing slash"""
    # Create an employee first
    employee_data = {
        "first_name": "Test",
        "last_name": "Worker",
        "email": "worker@example.com"
    }
    employee_response = client.post("/api/employees", json=employee_data)
    employee_id = employee_response.json()["id"]
    
    # Create work log
    work_log_data = {
        "employee_id": employee_id,
        "work_date": "2024-01-15",
        "work_hours": 8.0,
        "overtime_hours": 0.0,
        "vacation_hours": 0.0,
        "sick_leave_hours": 0.0,
        "other_hours": 0.0
    }
    response = client.post("/api/work-logs", json=work_log_data)
    assert response.status_code == 201
    data = response.json()
    assert data["work_hours"] == "8.00"

def test_work_logs_post_with_trailing_slash():
    """Test POST /api/work-logs/ with trailing slash"""
    # Create an employee first
    employee_data = {
        "first_name": "Test",
        "last_name": "Worker2",
        "email": "worker2@example.com"
    }
    employee_response = client.post("/api/employees", json=employee_data)
    employee_id = employee_response.json()["id"]
    
    # Create work log with trailing slash
    work_log_data = {
        "employee_id": employee_id,
        "work_date": "2024-01-16",
        "work_hours": 8.0,
        "overtime_hours": 0.0,
        "vacation_hours": 0.0,
        "sick_leave_hours": 0.0,
        "other_hours": 0.0
    }
    response = client.post("/api/work-logs/", json=work_log_data)
    assert response.status_code == 201
    data = response.json()
    assert data["work_hours"] == "8.00"
