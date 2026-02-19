from passlib.context import CryptContext
from sqlalchemy.orm import Session
import os

from app.database import SessionLocal
from app.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def init_database() -> None:
    """Create default admin user if it does not exist."""
    db: Session = SessionLocal()
    try:
        admin_username = os.getenv("DEFAULT_ADMIN_USERNAME", "admin")
        admin_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")

        existing = db.query(User).filter(User.username == admin_username).first()
        if existing is None:
            hashed = pwd_context.hash(admin_password)
            admin_user = User(
                username=admin_username,
                password_hash=hashed,
                role="admin",
                employee_id=None,
            )
            db.add(admin_user)
            db.commit()
            print(f"✅ Default admin user created (username: {admin_username})")
        else:
            print("✅ Admin user already exists")
    except Exception as exc:
        print(f"❌ Database initialization failed: {exc}")
        db.rollback()
        raise
    finally:
        db.close()
