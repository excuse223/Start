"""Tests for projects API routes."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

from app.main import app
from app.database import Base, get_db
from app.models import User, Employee

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_projects.db"
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
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def _create_admin(username="admin_proj", password="adminpass"):
    db = TestingSessionLocal()
    try:
        user = User(
            username=username,
            password_hash=pwd_context.hash(password),
            role="admin",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def _get_token(username="admin_proj", password="adminpass"):
    resp = client.post("/api/auth/login", json={"username": username, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["token"]


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_list_projects_requires_auth():
    resp = client.get("/api/projects")
    assert resp.status_code == 403


def test_create_and_list_projects():
    _create_admin()
    token = _get_token()
    headers = _auth_headers(token)

    # Create a project
    resp = client.post("/api/projects", json={
        "name": "Test Project",
        "client": "ACME Corp",
        "status": "planning",
    }, headers=headers)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["name"] == "Test Project"
    assert data["client"] == "ACME Corp"
    assert data["status"] == "planning"
    project_id = data["id"]

    # List projects
    resp = client.get("/api/projects", headers=headers)
    assert resp.status_code == 200
    assert any(p["id"] == project_id for p in resp.json())


def test_update_project():
    _create_admin()
    token = _get_token()
    headers = _auth_headers(token)

    resp = client.post("/api/projects", json={"name": "Old Name", "status": "planning"}, headers=headers)
    assert resp.status_code == 201
    project_id = resp.json()["id"]

    resp = client.put(f"/api/projects/{project_id}", json={"name": "New Name", "status": "active"}, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "New Name"
    assert data["status"] == "active"


def test_delete_project():
    _create_admin()
    token = _get_token()
    headers = _auth_headers(token)

    resp = client.post("/api/projects", json={"name": "To Delete", "status": "planning"}, headers=headers)
    assert resp.status_code == 201
    project_id = resp.json()["id"]

    resp = client.delete(f"/api/projects/{project_id}", headers=headers)
    assert resp.status_code == 204

    resp = client.get(f"/api/projects/{project_id}", headers=headers)
    assert resp.status_code == 404


def test_get_nonexistent_project():
    _create_admin()
    token = _get_token()
    headers = _auth_headers(token)

    resp = client.get("/api/projects/9999", headers=headers)
    assert resp.status_code == 404
