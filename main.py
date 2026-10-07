from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import models
from database import Base, engine, get_db
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from datetime import timedelta

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SpendWise API - Fintech Grade",
    description="JWT Secured Expense & Income Tracker - Ghana",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Schemas ---
class UserCreate(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str = "General"
    description: Optional[str] = ""

class IncomeCreate(BaseModel):
    title: str
    amount: float
    source: str = "Other"

# --- Root ---
@app.get("/")
def home():
    return {"message": "Welcome to SpendWise API v2 - JWT Secured", "docs": "/docs", "status": "Live"}

# --- Auth ---
@app.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    hashed = get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    token = create_access_token(data={"sub": new_user.username}, expires_delta=timedelta(hours=24))
    return {"access_token": token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(data={"sub": user.username}, expires_delta=timedelta(hours=24))
    return {"access_token": token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user

# --- Expenses (PROTECTED) ---
@app.post("/expenses/")
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    data = expense.model_dump()
    # if your Expense model has user_id, it will use it - if not, it still works
    if hasattr(models.Expense, 'user_id'):
        data['user_id'] = current_user.id
    new_expense = models.Expense(**data)
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

@app.get("/expenses/")
def get_expenses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Expense)
    if hasattr(models.Expense, 'user_id'):
        query = query.filter(models.Expense.user_id == current_user.id)
    return query.all()

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    q = db.query(models.Expense).filter(models.Expense.id == expense_id)
    if hasattr(models.Expense, 'user_id'):
        q = q.filter(models.Expense.user_id == current_user.id)
    exp = q.first()
    if not exp:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(exp)
    db.commit()
    return {"message": "Deleted"}

# --- Incomes (PROTECTED) ---
@app.post("/incomes/")
def create_income(income: IncomeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    data = income.model_dump()
    if hasattr(models.Income, 'user_id'):
        data['user_id'] = current_user.id
    new_income = models.Income(**data)
    db.add(new_income)
    db.commit()
    db.refresh(new_income)
    return new_income

@app.get("/incomes/")
def get_incomes(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Income)
    if hasattr(models.Income, 'user_id'):
        query = query.filter(models.Income.user_id == current_user.id)
    return query.all()

# --- Analytics (RECRUITERS LOVE THIS) ---
@app.get("/analytics/summary")
def get_summary(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    exp_query = db.query(models.Expense)
    inc_query = db.query(models.Income)
    if hasattr(models.Expense, 'user_id'):
        exp_query = exp_query.filter(models.Expense.user_id == current_user.id)
    if hasattr(models.Income, 'user_id'):
        inc_query = inc_query.filter(models.Income.user_id == current_user.id)

    expenses = exp_query.all()
    incomes = inc_query.all()
    total_expense = sum(e.amount for e in expenses)
    total_income = sum(i.amount for i in incomes)
    return {
        "user": current_user.username,
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
        "expense_count": len(expenses),
        "income_count": len(incomes)
    }