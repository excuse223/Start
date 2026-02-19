import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
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
    app.dependency_overrides[get_db] = override_get_db
    yield
    # Clean up tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

def test_read_root():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()
    assert response.json()["message"] == "Work Hours Management System API"

def test_health_check():
    """Test health endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_create_employee():
    """Test creating an employee"""
    employee_data = {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com"
    }
    response = client.post("/api/employees", json=employee_data)
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "John"
    assert data["last_name"] == "Doe"
    assert "id" in data

def test_create_employee_without_optional_fields():
    """Test creating an employee without optional fields (email, hourly_rate, overtime_rate)"""
    employee_data = {
        "first_name": "Jane",
        "last_name": "Smith"
    }
    response = client.post("/api/employees", json=employee_data)
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "Jane"
    assert data["last_name"] == "Smith"
    assert data["email"] is None
    assert data["hourly_rate"] is None
    assert data["overtime_rate"] is None
    assert "id" in data

def test_create_employee_with_hourly_rate():
    """Test creating an employee with hourly_rate"""
    employee_data = {
        "first_name": "Bob",
        "last_name": "Johnson",
        "email": "bob@example.com",
        "hourly_rate": 25.50
    }
    response = client.post("/api/employees", json=employee_data)
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "Bob"
    assert data["last_name"] == "Johnson"
    assert data["hourly_rate"] == 25.50
    assert data["overtime_rate"] is None

def test_create_employee_with_zero_hourly_rate():
    """Test creating an employee with zero hourly_rate (0 is a valid value)"""
    employee_data = {
        "first_name": "Alice",
        "last_name": "Brown",
        "hourly_rate": 0.0
    }
    response = client.post("/api/employees", json=employee_data)
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "Alice"
    assert data["last_name"] == "Brown"
    assert data["hourly_rate"] == 0.0


def test_get_employees():
    """Test getting list of employees"""
    # Create an employee first
    employee_data = {
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane.smith@example.com"
    }
    client.post("/api/employees", json=employee_data)
    
    # Get employees list
    response = client.get("/api/employees")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

def test_get_employee_by_id():
    """Test getting employee by ID"""
    # Create an employee
    employee_data = {
        "first_name": "Bob",
        "last_name": "Johnson",
        "email": "bob@example.com"
    }
    create_response = client.post("/api/employees", json=employee_data)
    employee_id = create_response.json()["id"]
    
    # Get employee by ID
    response = client.get(f"/api/employees/{employee_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Bob"
    assert data["last_name"] == "Johnson"

def test_update_employee():
    """Test updating an employee"""
    # Create an employee
    employee_data = {
        "first_name": "Alice",
        "last_name": "Williams",
        "email": "alice@example.com"
    }
    create_response = client.post("/api/employees", json=employee_data)
    employee_id = create_response.json()["id"]
    
    # Update employee
    update_data = {
        "first_name": "Alice",
        "last_name": "Smith",
        "email": "alice.smith@example.com"
    }
    response = client.put(f"/api/employees/{employee_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["last_name"] == "Smith"
    assert data["email"] == "alice.smith@example.com"

def test_delete_employee():
    """Test deleting an employee"""
    # Create an employee
    employee_data = {
        "first_name": "Charlie",
        "last_name": "Brown",
        "email": "charlie@example.com"
    }
    create_response = client.post("/api/employees", json=employee_data)
    employee_id = create_response.json()["id"]
    
    # Delete employee
    response = client.delete(f"/api/employees/{employee_id}")
    assert response.status_code == 204
    
    # Verify employee is deleted
    get_response = client.get(f"/api/employees/{employee_id}")
    assert get_response.status_code == 404

def test_create_work_log():
    """Test creating a work log"""
    # Create an employee first
    employee_data = {
        "first_name": "David",
        "last_name": "Lee",
        "email": "david@example.com"
    }
    employee_response = client.post("/api/employees", json=employee_data)
    employee_id = employee_response.json()["id"]
    
    # Create work log
    work_log_data = {
        "employee_id": employee_id,
        "work_date": "2024-01-15",
        "work_hours": 8.0,
        "overtime_hours": 2.0,
        "vacation_hours": 0.0,
        "sick_leave_hours": 0.0,
        "other_hours": 0.0,
        "notes": "Test work log"
    }
    response = client.post("/api/work-logs", json=work_log_data)
    assert response.status_code == 201
    data = response.json()
    assert data["work_hours"] == "8.00"
    assert data["overtime_hours"] == "2.00"

def test_work_log_validation_warning():
    """Test work log validation for hours > 12"""
    # Create an employee
    employee_data = {
        "first_name": "Eve",
        "last_name": "Martinez",
        "email": "eve@example.com"
    }
    employee_response = client.post("/api/employees", json=employee_data)
    employee_id = employee_response.json()["id"]
    
    # Create work log with > 12 hours
    work_log_data = {
        "employee_id": employee_id,
        "work_date": "2024-01-16",
        "work_hours": 10.0,
        "overtime_hours": 4.0,
        "vacation_hours": 0.0,
        "sick_leave_hours": 0.0,
        "other_hours": 0.0,
        "notes": "Long day"
    }
    response = client.post("/api/work-logs", json=work_log_data)
    assert response.status_code == 201
    data = response.json()
    # Should have a warning
    assert data["warning"] is not None
    assert "exceeds 12 hours" in data["warning"]

def test_work_log_duplicate_date():
    """Test that duplicate work logs for same employee and date are rejected"""
    # Create an employee
    employee_data = {
        "first_name": "Frank",
        "last_name": "Garcia",
        "email": "frank@example.com"
    }
    employee_response = client.post("/api/employees", json=employee_data)
    employee_id = employee_response.json()["id"]
    
    # Create first work log
    work_log_data = {
        "employee_id": employee_id,
        "work_date": "2024-01-17",
        "work_hours": 8.0,
        "overtime_hours": 0.0,
        "vacation_hours": 0.0,
        "sick_leave_hours": 0.0,
        "other_hours": 0.0
    }
    response1 = client.post("/api/work-logs", json=work_log_data)
    assert response1.status_code == 201
    
    # Try to create duplicate
    response2 = client.post("/api/work-logs", json=work_log_data)
    assert response2.status_code == 400
    assert "already exists" in response2.json()["detail"]

def test_get_work_logs_with_filters():
    """Test getting work logs with filters"""
    # Create an employee
    employee_data = {
        "first_name": "Grace",
        "last_name": "Taylor",
        "email": "grace@example.com"
    }
    employee_response = client.post("/api/employees", json=employee_data)
    employee_id = employee_response.json()["id"]
    
    # Create work logs
    for day in range(1, 4):
        work_log_data = {
            "employee_id": employee_id,
            "work_date": f"2024-01-{day:02d}",
            "work_hours": 8.0,
            "overtime_hours": 0.0,
            "vacation_hours": 0.0,
            "sick_leave_hours": 0.0,
            "other_hours": 0.0
        }
        client.post("/api/work-logs", json=work_log_data)
    
    # Get work logs filtered by employee
    response = client.get(f"/api/work-logs?employee_id={employee_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3

def test_get_work_logs_summary():
    """Test getting summary of all work logs"""
    # Test empty summary
    response = client.get("/api/work-logs/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_work_hours"] == 0
    assert data["total_overtime_hours"] == 0
    assert data["total_vacation_hours"] == 0
    assert data["total_sick_leave_hours"] == 0
    assert data["total_absent_hours"] == 0
    assert data["total_other_hours"] == 0
    assert data["total_logs"] == 0
    
    # Create an employee
    employee_data = {
        "first_name": "Test",
        "last_name": "User",
        "email": "test@example.com"
    }
    employee_response = client.post("/api/employees", json=employee_data)
    employee_id = employee_response.json()["id"]
    
    # Create multiple work logs with different hour types
    work_logs_data = [
        {
            "employee_id": employee_id,
            "work_date": "2024-01-01",
            "work_hours": 8.0,
            "overtime_hours": 2.0,
            "vacation_hours": 0.0,
            "sick_leave_hours": 0.0,
            "absent_hours": 0.0,
            "other_hours": 0.0
        },
        {
            "employee_id": employee_id,
            "work_date": "2024-01-02",
            "work_hours": 6.0,
            "overtime_hours": 0.0,
            "vacation_hours": 2.0,
            "sick_leave_hours": 0.0,
            "absent_hours": 0.0,
            "other_hours": 0.0
        },
        {
            "employee_id": employee_id,
            "work_date": "2024-01-03",
            "work_hours": 0.0,
            "overtime_hours": 0.0,
            "vacation_hours": 0.0,
            "sick_leave_hours": 8.0,
            "absent_hours": 0.0,
            "other_hours": 0.0
        },
        {
            "employee_id": employee_id,
            "work_date": "2024-01-04",
            "work_hours": 0.0,
            "overtime_hours": 0.0,
            "vacation_hours": 0.0,
            "sick_leave_hours": 0.0,
            "absent_hours": 8.0,
            "other_hours": 0.0
        }
    ]
    
    for log_data in work_logs_data:
        client.post("/api/work-logs", json=log_data)
    
    # Get summary
    response = client.get("/api/work-logs/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_work_hours"] == 14.0
    assert data["total_overtime_hours"] == 2.0
    assert data["total_vacation_hours"] == 2.0
    assert data["total_sick_leave_hours"] == 8.0
    assert data["total_absent_hours"] == 8.0
    assert data["total_other_hours"] == 0.0
    assert data["total_logs"] == 4
