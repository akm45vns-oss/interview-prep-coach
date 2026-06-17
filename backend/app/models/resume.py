from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    raw_text = Column(Text, nullable=True)
    parsed_skills = Column(JSON, nullable=True)        # List[str]
    parsed_education = Column(JSON, nullable=True)     # List[dict]
    parsed_projects = Column(JSON, nullable=True)      # List[dict]
    parsed_experience = Column(JSON, nullable=True)    # List[dict]
    contact_info = Column(JSON, nullable=True)         # dict
    ats_score = Column(Float, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="resumes")
    sessions = relationship("InterviewSession", back_populates="resume")
    roadmaps = relationship("LearningRoadmap", back_populates="resume")

    def __repr__(self):
        return f"<Resume id={self.id} user_id={self.user_id} filename={self.filename}>"


class LearningRoadmap(Base):
    __tablename__ = "learning_roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    role = Column(String(255), nullable=False)
    roadmap_json = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="roadmaps")
    resume = relationship("Resume", back_populates="roadmaps")
