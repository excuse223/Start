from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from app.database import get_db
from app.models import Employee, Project, User
from app.middleware.auth import get_current_user

router = APIRouter()


@router.get("")
def global_search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = q.strip().lower()

    employees = (
        db.query(Employee)
        .filter(
            or_(
                Employee.first_name.ilike(f"%{query}%"),
                Employee.last_name.ilike(f"%{query}%"),
                Employee.email.ilike(f"%{query}%"),
            )
        )
        .limit(5)
        .all()
    )

    projects = (
        db.query(Project)
        .filter(
            or_(
                Project.name.ilike(f"%{query}%"),
                Project.client.ilike(f"%{query}%"),
                Project.description.ilike(f"%{query}%"),
            )
        )
        .limit(5)
        .all()
    )

    users_result = []
    if current_user.role == 'admin':
        users_result = (
            db.query(User)
            .filter(User.username.ilike(f"%{query}%"))
            .limit(5)
            .all()
        )

    return {
        "query": q,
        "results": {
            "employees": [
                {"id": e.id, "type": "employee", "title": f"{e.first_name} {e.last_name}", "subtitle": e.email or ""}
                for e in employees
            ],
            "projects": [
                {"id": p.id, "type": "project", "title": p.name, "subtitle": p.client or p.status}
                for p in projects
            ],
            "users": [
                {"id": u.id, "type": "user", "title": u.username, "subtitle": u.role}
                for u in users_result
            ],
        },
    }
