# GymTracker

A full-stack gym workout tracking web application with authentication, training plan management, workout logging, and weight tracking.

## Stack

- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **Frontend**: React + TypeScript + Vite
- **Auth**: JWT (stored in localStorage)
- **Passwords**: bcrypt

## Features

- **Dashboard** — active plan overview, progress bar, streak, recent workouts, weight panel, stats
- **Create Plan** — step-by-step plan builder (days/week, duration, day naming, exercises with muscle groups and sets)
- **My Plans** — browse plans → weeks → days → workout logging with set/rep/weight tracking and week-over-week comparisons
- **My Weight** — weight cycle setup, daily weight entry (Mon–Sun), weekly averages, progress comparisons

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

## Setup

### 1. PostgreSQL

Create a database:

```sql
CREATE DATABASE gymtracker;
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
```

Copy the example env and fill in your credentials:

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL and a random SECRET_KEY
```

Start the backend:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Tables are auto-created on first run.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Environment Variables

### Backend (`backend/.env`)

```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/gymtracker
SECRET_KEY=your-long-random-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Frontend (`frontend/.env`)

```
VITE_API_URL=http://localhost:8000
```

## API Documentation

FastAPI auto-generates interactive docs at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
gym-tracker/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app + CORS + table creation
│   │   ├── config.py        # Pydantic settings
│   │   ├── database.py      # SQLAlchemy engine + session
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── routers/         # Route handlers (auth, plans, weight, dashboard)
│   │   ├── services/        # Business logic
│   │   └── auth/            # JWT + bcrypt
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # Layout, navigation
│   │   ├── pages/           # Dashboard, CreatePlan, MyPlans, MyWeight, Login, Register
│   │   ├── services/        # Axios API client
│   │   ├── hooks/           # useAuth
│   │   └── types/           # TypeScript types
│   └── .env
└── README.md
```
