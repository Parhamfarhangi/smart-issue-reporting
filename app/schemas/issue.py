from pydantic import BaseModel

class IssueCreate(BaseModel):
    title: str
    description: str
    category: str
    latitude: float
    longitude: float