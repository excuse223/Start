import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models import User
from passlib.context import CryptContext

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_auth.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

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


@pytest.fixture(autouse=True)
def cleanup():
    """Ensure correct DB override and clean up after each test."""
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def _create_user(username: str, password: str, role: str, employee_id=None) -> User:
    """Helper to insert a user directly into the test DB."""
    db = TestingSessionLocal()
    try:
        user = User(
            username=username,
            password_hash=pwd_context.hash(password),
            role=role,
            employee_id=employee_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


# --- Login tests ---

def test_login_success():
    """Test successful login returns token and user info."""
    _create_user("testadmin", "secret123", "admin")

    response = client.post("/api/auth/login", json={"username": "testadmin", "password": "secret123"})
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["user"]["username"] == "testadmin"
    assert data["user"]["role"] == "admin"
    assert data["user"]["employee_id"] is None


def test_login_invalid_password():
    """Test login with wrong password returns 401."""
    _create_user("testadmin2", "correct", "admin")

    response = client.post("/api/auth/login", json={"username": "testadmin2", "password": "wrong"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


def test_login_unknown_user():
    """Test login with unknown username returns 401."""
    response = client.post("/api/auth/login", json={"username": "nobody", "password": "pass"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


def test_login_missing_fields():
    """Test login with empty credentials returns 400."""
    response = client.post("/api/auth/login", json={"username": "", "password": ""})
    assert response.status_code == 400


# --- /me endpoint tests ---

def test_get_me_with_valid_token():
    """Test /me returns current user info with valid token."""
    _create_user("meuser", "pass123", "manager")

    login_response = client.post("/api/auth/login", json={"username": "meuser", "password": "pass123"})
    token = login_response.json()["token"]

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "meuser"
    assert data["role"] == "manager"


def test_get_me_without_token():
    """Test /me without token returns 403."""
    response = client.get("/api/auth/me")
    assert response.status_code == 403


def test_get_me_with_invalid_token():
    """Test /me with invalid token returns 403."""
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
    assert response.status_code == 403
    assert response.json()["detail"] == "Invalid or expired token"


# --- Logout tests ---

def test_logout_with_valid_token():
    """Test logout returns success message."""
    _create_user("logoutuser", "pass123", "employee")

    login_response = client.post("/api/auth/login", json={"username": "logoutuser", "password": "pass123"})
    token = login_response.json()["token"]

    response = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully"


def test_logout_without_token():
    """Test logout without token returns 403."""
    response = client.post("/api/auth/logout")
    assert response.status_code == 403
