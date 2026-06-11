"""SQLAlchemy models for agent_conversation and agent_message."""

from datetime import datetime
from sqlalchemy import Column, BigInteger, String, Text, Integer, DateTime, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class AgentConversation(Base):
    __tablename__ = "agent_conversation"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    owner_id = Column(BigInteger, nullable=False)
    title = Column(String(255), nullable=False, default="")
    status = Column(String(32), nullable=False, default="active")
    metadata_ = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class AgentMessage(Base):
    __tablename__ = "agent_message"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    conversation_id = Column(BigInteger, nullable=False)
    role = Column(String(32), nullable=False)
    content = Column(Text, nullable=False, default="")
    tool_calls = Column(JSON, nullable=True)
    tool_call_id = Column(String(64), nullable=True)
    tokens_used = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
