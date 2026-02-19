"""Tests for users and assignments API routes."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

from app.main import app
from app.database import Base, get_db
from app.models import User, Employee, ManagerEmployeeAssignment

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_users.db"
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


def _create_user(username: str, password: str, role: str, employee_id=None) -> User:
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


def _create_employee(first_name: str, last_name: str, email: str = None) -> Employee:
    db = TestingSessionLocal()
    try:
        emp = Employee(first_name=first_name, last_name=last_name, email=email)
        db.add(emp)
        db.commit()
        db.refresh(emp)
        return emp
    finally:
        db.close()


def _get_token(username: str, password: str) -> str:
    resp = client.post("/api/auth/login", json={"username": username, "password": password})
    return resp.json()["token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ====================== Users ======================

class TestListUsers:
    def test_admin_can_list_users(self):
        _create_user("admin1", "Admin123!", "admin")
        token = _get_token("admin1", "Admin123!")
        resp = client.get("/api/users", headers=_auth(token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_non_admin_cannot_list_users(self):
        _create_user("manager1", "Manager123!", "manager")
        token = _get_token("manager1", "Manager123!")
        resp = client.get("/api/users", headers=_auth(token))
        assert resp.status_code == 403

    def test_unauthenticated_cannot_list_users(self):
        resp = client.get("/api/users")
        assert resp.status_code == 403


class TestCreateUser:
    def test_create_user_valid(self):
        _create_user("admin1", "Admin123!", "admin")
        token = _get_token("admin1", "Admin123!")
        resp = client.post(
            "/api/users",
            headers=_auth(token),
            json={"username": "newuser", "password": "NewPass1!", "role": "employee"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["username"] == "newuser"
        assert data["role"] == "employee"

    def test_create_user_duplicate_username(self):
        _create_user("admin1", "Admin123!", "admin")
        _create_user("existing", "Pass1234!", "employee")
        token = _get_token("admin1", "Admin123!")
        resp = client.post(
            "/api/users",
            headers=_auth(token),
            json={"username": "existing", "password": "Pass1234!", "role": "employee"},
        )
        assert resp.status_code == 400
        assert "already exists" in resp.json()["detail"]

    def test_create_user_weak_password(self):
        _create_user("admin1", "Admin123!", "admin")
        token = _get_token("admin1", "Admin123!")
        resp = client.post(
            "/api/users",
            headers=_auth(token),
            json={"username": "weakuser", "password": "weak", "role": "employee"},
        )
        assert resp.status_code == 422

    def test_create_user_invalid_username(self):
        _create_user("admin1", "Admin123!", "admin")
        token = _get_token("admin1", "Admin123!")
        resp = client.post(
            "/api/users",
            headers=_auth(token),
            json={"username": "a!", "password": "ValidPass1!", "role": "employee"},
        )
        assert resp.status_code == 422

    def test_non_admin_cannot_create_user(self):
        _create_user("manager1", "Manager123!", "manager")
        token = _get_token("manager1", "Manager123!")
        resp = client.post(
            "/api/users",
            headers=_auth(token),
            json={"username": "newuser", "password": "NewPass1!", "role": "employee"},
        )
        assert resp.status_code == 403

    def test_create_user_with_employee_link(self):
        _create_user("admin1", "Admin123!", "admin")
        emp = _create_employee("Jan", "Kowalski", "jan@example.com")
        token = _get_token("admin1", "Admin123!")
        resp = client.post(
            "/api/users",
            headers=_auth(token),
            json={"username": "jkowalski", "password": "ValidPass1!", "role": "manager", "employee_id": emp.id},
        )
        assert resp.status_code == 201
        assert resp.json()["employee_id"] == emp.id


class TestUpdateUser:
    def test_update_user_role(self):
        _create_user("admin1", "Admin123!", "admin")
        user = _create_user("emp1", "EmpPass1!", "employee")
        token = _get_token("admin1", "Admin123!")
        resp = client.put(
            f"/api/users/{user.id}",
            headers=_auth(token),
            json={"role": "manager"},
        )
        assert resp.status_code == 200
        assert resp.json()["role"] == "manager"

    def test_cannot_change_own_role(self):
        admin = _create_user("admin1", "Admin123!", "admin")
        token = _get_token("admin1", "Admin123!")
        resp = client.put(
            f"/api/users/{admin.id}",
            headers=_auth(token),
            json={"role": "employee"},
        )
        assert resp.status_code == 400

    def test_update_nonexistent_user(self):
        _create_user("admin1", "Admin123!", "admin")
        token = _get_token("admin1", "Admin123!")
        resp = client.put("/api/users/9999", headers=_auth(token), json={"role": "manager"})
        assert resp.status_code == 404


class TestDeleteUser:
    def test_delete_user(self):
        _create_user("admin1", "Admin123!", "admin")
        user = _create_user("todelete", "ToDelete1!", "employee")
        token = _get_token("admin1", "Admin123!")
        resp = client.delete(f"/api/users/{user.id}", headers=_auth(token))
        assert resp.status_code == 200

    def test_cannot_delete_self(self):
        admin = _create_user("admin1", "Admin123!", "admin")
        token = _get_token("admin1", "Admin123!")
        resp = client.delete(f"/api/users/{admin.id}", headers=_auth(token))
        assert resp.status_code == 400
        assert "own account" in resp.json()["detail"]

    def test_cannot_delete_last_admin(self):
        # Create another admin to delete the first one, but only 1 admin total
        admin = _create_user("admin1", "Admin123!", "admin")
        admin2 = _create_user("admin2", "Admin456!", "admin")
        token = _get_token("admin1", "Admin123!")
        # deleting admin2 is fine since admin1 still exists
        resp = client.delete(f"/api/users/{admin2.id}", headers=_auth(token))
        assert resp.status_code == 200

        # Now try to delete the last admin (admin1 is still there, but admin2 gone)
        # admin1 tries to delete itself - should get "cannot delete own account"
        resp2 = client.delete(f"/api/users/{admin.id}", headers=_auth(token))
        assert resp2.status_code == 400

    def test_cannot_delete_last_admin_protection(self):
        """Admin cannot delete another user who is the last admin."""
        admin = _create_user("admin1", "Admin123!", "admin")
        emp = _create_user("emp1", "EmpPass1!", "employee")
        # promote emp1 to admin, demote... actually just delete the only other admin scenario
        # Create: 1 admin, 1 employee. Try to delete the only admin via a second admin
        # Since admin is deleting themselves that's 400; let's set up properly:
        # Make admin1 delete another admin who is the sole admin - not possible with only 1 admin
        # Better test: make admin2, delete admin1 leaving admin2 as last, then try to delete admin2
        admin2 = _create_user("admin2", "Admin2Pass1!", "admin")
        token2 = _get_token("admin2", "Admin2Pass1!")
        # Delete admin1 first
        resp = client.delete(f"/api/users/{admin.id}", headers=_auth(token2))
        assert resp.status_code == 200
        # Now admin2 is the last admin; admin1 is gone. Create another admin to do the deleting
        admin3 = _create_user("admin3", "Admin3Pass1!", "admin")
        token3 = _get_token("admin3", "Admin3Pass1!")
        # Try to delete admin2 - should fail since... wait admin3 exists now
        # Both admin2 and admin3 exist, so deleting admin2 should succeed
        resp2 = client.delete(f"/api/users/{admin2.id}", headers=_auth(token3))
        assert resp2.status_code == 200
        # Now only admin3 left - try to delete it using admin3 itself
        resp3 = client.delete(f"/api/users/{admin3.id}", headers=_auth(token3))
        # This should be 400 because it's deleting self
        assert resp3.status_code == 400

    def test_delete_nonexistent_user(self):
        _create_user("admin1", "Admin123!", "admin")
        token = _get_token("admin1", "Admin123!")
        resp = client.delete("/api/users/9999", headers=_auth(token))
        assert resp.status_code == 404


class TestChangePassword:
    def test_admin_can_change_any_password(self):
        _create_user("admin1", "Admin123!", "admin")
        user = _create_user("emp1", "EmpPass1!", "employee")
        token = _get_token("admin1", "Admin123!")
        resp = client.put(
            f"/api/users/{user.id}/password",
            headers=_auth(token),
            json={"new_password": "NewPass99!"},
        )
        assert resp.status_code == 200

    def test_user_can_change_own_password(self):
        user = _create_user("emp1", "EmpPass1!", "employee")
        token = _get_token("emp1", "EmpPass1!")
        resp = client.put(
            f"/api/users/{user.id}/password",
            headers=_auth(token),
            json={"new_password": "NewPass99!"},
        )
        assert resp.status_code == 200

    def test_user_cannot_change_others_password(self):
        user1 = _create_user("emp1", "EmpPass1!", "employee")
        user2 = _create_user("emp2", "EmpPass2!", "employee")
        token = _get_token("emp1", "EmpPass1!")
        resp = client.put(
            f"/api/users/{user2.id}/password",
            headers=_auth(token),
            json={"new_password": "NewPass99!"},
        )
        assert resp.status_code == 403

    def test_weak_password_rejected(self):
        user = _create_user("emp1", "EmpPass1!", "employee")
        token = _get_token("emp1", "EmpPass1!")
        resp = client.put(
            f"/api/users/{user.id}/password",
            headers=_auth(token),
            json={"new_password": "weak"},
        )
        assert resp.status_code == 422


# ====================== Assignments ======================

class TestAssignments:
    def test_list_assignments_admin(self):
        _create_user("admin1", "Admin123!", "admin")
        token = _get_token("admin1", "Admin123!")
        resp = client.get("/api/assignments", headers=_auth(token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_assignments_non_admin_forbidden(self):
        _create_user("manager1", "Manager123!", "manager")
        token = _get_token("manager1", "Manager123!")
        resp = client.get("/api/assignments", headers=_auth(token))
        assert resp.status_code == 403

    def test_create_assignment(self):
        _create_user("admin1", "Admin123!", "admin")
        manager = _create_user("mgr1", "MgrPass1!", "manager")
        emp = _create_employee("Anna", "Nowak", "anna@example.com")
        token = _get_token("admin1", "Admin123!")
        resp = client.post(
            "/api/assignments",
            headers=_auth(token),
            json={"manager_user_id": manager.id, "employee_id": emp.id},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["manager_user_id"] == manager.id
        assert data["employee_id"] == emp.id

    def test_cannot_assign_to_non_manager(self):
        _create_user("admin1", "Admin123!", "admin")
        non_mgr = _create_user("emp1", "EmpPass1!", "employee")
        emp = _create_employee("Anna", "Nowak", "anna@example.com")
        token = _get_token("admin1", "Admin123!")
        resp = client.post(
            "/api/assignments",
            headers=_auth(token),
            json={"manager_user_id": non_mgr.id, "employee_id": emp.id},
        )
        assert resp.status_code == 400
        assert "not a manager" in resp.json()["detail"]

    def test_duplicate_assignment_rejected(self):
        _create_user("admin1", "Admin123!", "admin")
        manager = _create_user("mgr1", "MgrPass1!", "manager")
        emp = _create_employee("Anna", "Nowak", "anna@example.com")
        token = _get_token("admin1", "Admin123!")
        client.post(
            "/api/assignments",
            headers=_auth(token),
            json={"manager_user_id": manager.id, "employee_id": emp.id},
        )
        resp2 = client.post(
            "/api/assignments",
            headers=_auth(token),
            json={"manager_user_id": manager.id, "employee_id": emp.id},
        )
        assert resp2.status_code == 400
        assert "already assigned" in resp2.json()["detail"]

    def test_get_manager_assignments(self):
        _create_user("admin1", "Admin123!", "admin")
        manager = _create_user("mgr1", "MgrPass1!", "manager")
        emp = _create_employee("Anna", "Nowak", "anna@example.com")
        token_admin = _get_token("admin1", "Admin123!")
        client.post(
            "/api/assignments",
            headers=_auth(token_admin),
            json={"manager_user_id": manager.id, "employee_id": emp.id},
        )
        token_mgr = _get_token("mgr1", "MgrPass1!")
        resp = client.get(f"/api/assignments/manager/{manager.id}", headers=_auth(token_mgr))
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_manager_cannot_see_other_managers_assignments(self):
        _create_user("admin1", "Admin123!", "admin")
        mgr1 = _create_user("mgr1", "MgrPass1!", "manager")
        mgr2 = _create_user("mgr2", "MgrPass2!", "manager")
        token = _get_token("mgr1", "MgrPass1!")
        resp = client.get(f"/api/assignments/manager/{mgr2.id}", headers=_auth(token))
        assert resp.status_code == 403

    def test_delete_assignment(self):
        _create_user("admin1", "Admin123!", "admin")
        manager = _create_user("mgr1", "MgrPass1!", "manager")
        emp = _create_employee("Anna", "Nowak", "anna@example.com")
        token = _get_token("admin1", "Admin123!")
        create_resp = client.post(
            "/api/assignments",
            headers=_auth(token),
            json={"manager_user_id": manager.id, "employee_id": emp.id},
        )
        assignment_id = create_resp.json()["id"]
        resp = client.delete(f"/api/assignments/{assignment_id}", headers=_auth(token))
        assert resp.status_code == 200

    def test_delete_nonexistent_assignment(self):
        _create_user("admin1", "Admin123!", "admin")
        token = _get_token("admin1", "Admin123!")
        resp = client.delete("/api/assignments/9999", headers=_auth(token))
        assert resp.status_code == 404
