import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from app.main import app
from app.database import Base, get_db
from app.models import User

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_trailing_slash.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def _create_admin(username="ts_admin", password="TestPass1"):
    db = TestingSessionLocal()
    try:
        user = User(username=username, password_hash=pwd_context.hash(password), role="admin")
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def _get_token(username="ts_admin", password="TestPass1"):
    resp = client.post("/api/auth/login", json={"username": username, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["token"]


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def cleanup():
    """Clean up database after each test"""
    app.dependency_overrides[get_db] = override_get_db
    yield
    # Clean up tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

def test_employees_get_without_trailing_slash():
    """Test GET /api/employees without trailing slash"""
    _create_admin()
    token = _get_token()
    headers = _auth_headers(token)
    response = client.get("/api/employees", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_employees_get_with_trailing_slash():
    """Test GET /api/employees/ with trailing slash"""
    _create_admin()
    token = _get_token()
    headers = _auth_headers(token)
    response = client.get("/api/employees/", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_employees_post_without_trailing_slash():
    """Test POST /api/employees without trailing slash"""
    _create_admin()
    token = _get_token()
    headers = _auth_headers(token)
    employee_data = {
        "first_name": "Test",
        "last_name": "User",
        "email": "test@example.com"
    }
    response = client.post("/api/employees", json=employee_data, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "Test"
    assert data["last_name"] == "User"

def test_employees_post_with_trailing_slash():
    """Test POST /api/employees/ with trailing slash"""
    _create_admin()
    token = _get_token()
    headers = _auth_headers(token)
    employee_data = {
        "first_name": "Test2",
        "last_name": "User2",
        "email": "test2@example.com"
    }
    response = client.post("/api/employees/", json=employee_data, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "Test2"
    assert data["last_name"] == "User2"

def test_work_logs_get_without_trailing_slash():
    """Test GET /api/work-logs without trailing slash"""
    _create_admin()
    token = _get_token()
    headers = _auth_headers(token)
    response = client.get("/api/work-logs", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_work_logs_get_with_trailing_slash():
    """Test GET /api/work-logs/ with trailing slash"""
    _create_admin()
    token = _get_token()
    headers = _auth_headers(token)
    response = client.get("/api/work-logs/", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_work_logs_post_without_trailing_slash():
    """Test POST /api/work-logs without trailing slash"""
    _create_admin()
    token = _get_token()
    headers = _auth_headers(token)
    # Create an employee first
    employee_data = {
        "first_name": "Test",
        "last_name": "Worker",
        "email": "worker@example.com"
    }
    employee_response = client.post("/api/employees", json=employee_data, headers=headers)
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
    response = client.post("/api/work-logs", json=work_log_data, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["work_hours"] == "8.00"

def test_work_logs_post_with_trailing_slash():
    """Test POST /api/work-logs/ with trailing slash"""
    _create_admin()
    token = _get_token()
    headers = _auth_headers(token)
    # Create an employee first
    employee_data = {
        "first_name": "Test",
        "last_name": "Worker2",
        "email": "worker2@example.com"
    }
    employee_response = client.post("/api/employees", json=employee_data, headers=headers)
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
    response = client.post("/api/work-logs/", json=work_log_data, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["work_hours"] == "8.00"
