from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import engine, get_db, Base
import models
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SpendWise API - Fintech")

# Schemas
class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str = "General"
    description: Optional[str] = ""

class IncomeCreate(BaseModel):
    title: str
    amount: float
    source: str = "Other"

# Root
@app.get("/")
def home():
    return {"message": "Welcome to SpendWise API - Track your money smartly"}

# Expenses
@app.post("/expenses/")
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    new_expense = models.Expense(**expense.dict())
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

@app.get("/expenses/")
def get_expenses(db: Session = Depends(get_db)):
    return db.query(models.Expense).all()

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    exp = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if exp:
        db.delete(exp)
        db.commit()
        return {"message": "Deleted"}
    return {"error": "Not found"}

# Incomes
@app.post("/incomes/")
def create_income(income: IncomeCreate, db: Session = Depends(get_db)):
    new_income = models.Income(**income.dict())
    db.add(new_income)
    db.commit()
    db.refresh(new_income)
    return new_income

@app.get("/incomes/")
def get_incomes(db: Session = Depends(get_db)):
    return db.query(models.Income).all()

# Analytics - This is what recruiters love
@app.get("/analytics/summary")
def get_summary(db: Session = Depends(get_db)):
    expenses = db.query(models.Expense).all()
    incomes = db.query(models.Income).all()
    total_expense = sum(e.amount for e in expenses)
    total_income = sum(i.amount for i in incomes)
    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
        "expense_count": len(expenses)
    }
