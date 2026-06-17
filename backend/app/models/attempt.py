from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class InterviewAttempt(Base):
    __tablename__ = "interview_attempts"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("interview_questions.id", ondelete="CASCADE"), nullable=False)
    user_answer = Column(Text, nullable=False)

    # AI Evaluation
    ai_evaluation = Column(Text, nullable=True)          # Overall feedback text
    correctness_score = Column(Float, nullable=True)     # 0-10
    communication_score = Column(Float, nullable=True)   # 0-10
    relevance_score = Column(Float, nullable=True)       # 0-10
    total_score = Column(Float, nullable=True)           # 0-10
    ideal_answer = Column(Text, nullable=True)
    strengths = Column(JSON, nullable=True)              # List[str]
    improvements = Column(JSON, nullable=True)           # List[str]

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("InterviewSession", back_populates="attempts")
    question = relationship("InterviewQuestion", back_populates="attempt")
