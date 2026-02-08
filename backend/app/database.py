from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Require DATABASE_URL to be set, with fallback for local development only
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Default for local development - in production, DATABASE_URL must be set
    DATABASE_URL = "postgresql://admin:secure_password@localhost:5432/work_hours_db"
    print("WARNING: Using default DATABASE_URL for development. Set DATABASE_URL in production!")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
