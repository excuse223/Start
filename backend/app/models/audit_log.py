from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(20), nullable=False)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(Integer, nullable=True)
    old_values = Column(Text, nullable=True)
    new_values = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)

    user = relationship("User", foreign_keys=[user_id])
