from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from database import Base

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    amount = Column(Float)
    category = Column(String, default="General")
    description = Column(String, default="")
    date = Column(DateTime, default=datetime.utcnow)
    owner = Column(String, index=True)

class Income(Base):
    __tablename__ = "incomes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    amount = Column(Float)
    source = Column(String, default="Other")
    date = Column(DateTime, default=datetime.utcnow)
    owner = Column(String, index=True)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    