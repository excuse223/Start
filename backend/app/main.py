from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import employees, work_logs, reports
from app.database import engine, Base

app = FastAPI(
    title="Work Hours Management System",
    description="Sistema de gestión y facturación de horas de trabajo",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(employees.router, prefix="/api/employees", tags=["employees"])
app.include_router(work_logs.router, prefix="/api/work-logs", tags=["work-logs"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])

@app.get("/")
async def root():
    return {"message": "Work Hours Management System API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# Create tables on startup (for development - use Alembic for production)
@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)
