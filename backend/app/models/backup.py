from sqlalchemy import Column, Integer, String, BigInteger, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Backup(Base):
    __tablename__ = "backups"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_size = Column(BigInteger, nullable=True)
    backup_type = Column(String(20), nullable=False, default="full")
    storage_location = Column(String(20), nullable=False, default="local")
    encrypted = Column(Boolean, default=False)
    compressed = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    remote_path = Column(String(500), nullable=True)
    checksum = Column(String(64), nullable=True)
    status = Column(String(20), nullable=False, default="pending")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)

    creator = relationship("User", foreign_keys=[created_by])
    logs = relationship("BackupLog", back_populates="backup", cascade="all, delete-orphan")
