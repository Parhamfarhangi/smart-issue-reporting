from pydantic import BaseModel

class IssueStatusUpdate(BaseModel):
    status: str