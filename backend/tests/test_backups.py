"""Tests for backup API routes."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

from app.main import app
from app.database import Base, get_db
from app.models import User

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_backups.db"
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


def _create_admin(username="admin_backup", password="adminpass"):
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


def _create_employee_user(username="emp_user", password="emppass"):
    db = TestingSessionLocal()
    try:
        user = User(
            username=username,
            password_hash=pwd_context.hash(password),
            role="employee",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def _get_token(username, password="adminpass"):
    resp = client.post("/api/auth/login", json={"username": username, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["token"]


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_list_backups_requires_admin():
    _create_employee_user()
    token = _get_token("emp_user", "emppass")
    resp = client.get("/api/backups", headers=_auth_headers(token))
    assert resp.status_code == 403


def test_list_backups_empty():
    _create_admin()
    token = _get_token("admin_backup")
    resp = client.get("/api/backups", headers=_auth_headers(token))
    assert resp.status_code == 200
    assert resp.json() == []


def test_create_backup():
    _create_admin()
    token = _get_token("admin_backup")
    headers = _auth_headers(token)

    resp = client.post("/api/backups", headers=headers)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert "filename" in data
    assert data["backup_type"] == "full"
    assert data["status"] in ("completed", "failed")  # depends on pg_dump availability


def test_backup_status():
    _create_admin()
    token = _get_token("admin_backup")
    resp = client.get("/api/backups/status", headers=_auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert "total_backups" in data
    assert "next_scheduled" in data


def test_get_backup_config():
    _create_admin()
    token = _get_token("admin_backup")
    resp = client.get("/api/backups/config", headers=_auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert "retention_days" in data
    assert "compress_backups" in data


def test_delete_nonexistent_backup():
    _create_admin()
    token = _get_token("admin_backup")
    resp = client.delete("/api/backups/9999", headers=_auth_headers(token))
    assert resp.status_code == 404
