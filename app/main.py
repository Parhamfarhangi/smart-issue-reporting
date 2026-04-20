from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from app.database import engine, Base, get_db
from app.models.user import User
from app.schemas.user import UserCreate
from app.utils.security import hash_password
from app.schemas.login import LoginRequest
from app.utils.security import hash_password, verify_password
from app.utils.security import hash_password, verify_password, create_access_token
from app.utils.security import hash_password, verify_password, create_access_token, get_current_user_email
from app.models.issue import Issue
from app.schemas.issue import IssueCreate
from app.schemas.issue_update import IssueStatusUpdate
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"message": "Smart Issue Reporting API is running"}

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    hashed_pw = hash_password(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_pw
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created successfully"}
@app.post("/login")
@app.post("/login")
def login(user: LoginRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()

    if not existing_user:
        return {"message": "Invalid email or password"}

    if not verify_password(user.password, existing_user.password):
        return {"message": "Invalid email or password"}

    access_token = create_access_token(
        data={"sub": existing_user.email}
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer"
    }
@app.get("/me")
def read_current_user(current_user_email: str = Depends(get_current_user_email)):
    return {
        "message": "Protected route working",
        "email": current_user_email
    }
@app.post("/issues")
def create_issue(
    issue: IssueCreate,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    new_issue = Issue(
        title=issue.title,
        description=issue.description,
        category=issue.category,
        latitude=issue.latitude,
        longitude=issue.longitude,
        created_by=current_user_email
    )

    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)

    return {
        "message": "Issue created successfully",
        "issue_id": new_issue.id
    }
@app.get("/issues")
def get_all_issues(db: Session = Depends(get_db)):
    issues = db.query(Issue).all()
    return issues
@app.get("/my-issues")
def get_my_issues(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    issues = db.query(Issue).filter(Issue.created_by == current_user_email).all()
    return issues
@app.put("/issues/{issue_id}/status")
def update_issue_status(
    issue_id: int,
    update_data: IssueStatusUpdate,
    db: Session = Depends(get_db)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()

    if not issue:
        return {"message": "Issue not found"}

    issue.status = update_data.status
    db.commit()
    db.refresh(issue)

    return {
        "message": "Issue status updated successfully",
        "issue_id": issue.id,
        "new_status": issue.status
    }
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)