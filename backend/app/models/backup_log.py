from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class BackupLog(Base):
    __tablename__ = "backup_logs"

    id = Column(Integer, primary_key=True, index=True)
    backup_id = Column(Integer, ForeignKey("backups.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default="success")
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    backup = relationship("Backup", back_populates="logs")
