from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ManagerEmployeeAssignment(Base):
    __tablename__ = "manager_employee_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    manager_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    
    employee = relationship("Employee")
    
    __table_args__ = (
        UniqueConstraint('manager_user_id', 'employee_id', name='unique_manager_employee'),
    )
