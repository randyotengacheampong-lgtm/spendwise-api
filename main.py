from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models
from database import Base, engine, get_db, SessionLocal
from auth import hash_password, verify_password, create_token, get_current_user
from datetime import datetime

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SpendWise API - Fintech Grade")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Schemas
class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str = "General"
    description: str = ""

class IncomeCreate(BaseModel):
    title: str
    amount: float
    source: str = "Other"

class UserCreate(BaseModel):
    username: str
    password: str

@app.get("/")
def root():
    return {"message": "Welcome to SpendWise API - Fintech Secure", "phase": "2 - Postgres + JWT Live"}

# AUTH
@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    new_user = models.User(username=user.username, hashed_password=hash_password(user.password))
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully"}

@app.post("/login")
def login(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

# Expenses - Protected
@app.post("/expenses/")
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    new_expense = models.Expense(**expense.dict(), owner=current_user)
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

@app.get("/expenses/")
def get_expenses(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    return db.query(models.Expense).filter(models.Expense.owner == current_user).all()

# Incomes - Protected
@app.post("/incomes/")
def create_income(income: IncomeCreate, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    new_income = models.Income(**income.dict(), owner=current_user)
    db.add(new_income)
    db.commit()
    db.refresh(new_income)
    return new_income

@app.get("/incomes/")
def get_incomes(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    return db.query(models.Income).filter(models.Income.owner == current_user).all()

# Analytics - Protected
@app.get("/analytics/summary")
def get_summary(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    expenses = db.query(models.Expense).filter(models.Expense.owner == current_user).all()
    incomes = db.query(models.Income).filter(models.Income.owner == current_user).all()
    total_expense = sum(e.amount for e in expenses)
    total_income = sum(i.amount for i in incomes)
    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
        "expense_count": len(expenses)
    }