# Quick Start

## Terminal 1 — Backend
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

## Terminal 2 — Frontend
```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

## PostgreSQL password
The postgres user password was set to: `gymtracker123`
DATABASE_URL in backend/.env is already configured.
