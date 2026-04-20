from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    category = Column(String, nullable=False)
    status = Column(String, default="Pending")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_by = Column(String, nullable=False)
    