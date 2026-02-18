from sqlalchemy import Column, Integer, Numeric, String, Date, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class WorkLog(Base):
    __tablename__ = "work_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    work_date = Column(Date, nullable=False, index=True)
    work_hours = Column(Numeric(5, 2), default=0.0)
    overtime_hours = Column(Numeric(5, 2), default=0.0)
    vacation_hours = Column(Numeric(5, 2), default=0.0)
    sick_leave_hours = Column(Numeric(5, 2), default=0.0)
    other_hours = Column(Numeric(5, 2), default=0.0)
    absent_hours = Column(Numeric(5, 2), default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    employee = relationship("Employee", back_populates="work_logs")
    
    __table_args__ = (
        UniqueConstraint('employee_id', 'work_date', name='unique_employee_work_date'),
    )
