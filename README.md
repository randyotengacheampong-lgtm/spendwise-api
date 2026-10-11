# SpendWise

Personal finance dashboard for tracking income and expenses in Ghana Cedis (GHS).

## Live Links

- **Frontend**: https://spendwise-dashboard-three.vercel.app
- **Backend API**: https://spendwise-api-q6b6.onrender.com
- **API Docs**: https://spendwise-api-q6b6.onrender.com/docs

## Features

- Dashboard with Total Income, Total Expense, and Balance
- Add Expense with amount, category, and payment method (MTN MoMo, Cash, Card)
- Add Income
- Export data to CSV

## Tech Stack

- Frontend: React, Tailwind CSS (Vercel)
- Backend: Python, FastAPI (Render)
- Database: SQLite

## Local Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Deployment

Frontend on Vercel, Backend on Render. Push to `main` auto-deploys if connected.