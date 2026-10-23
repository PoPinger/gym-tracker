# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Working rules (read first)

- **Plan first.** Before editing anything, show a plan of the intended changes (files + what changes) and wait for explicit approval.
- **Minimal changes.** Touch only what the task needs. No drive-by refactors, reformatting, or edits to unrelated code.
- **UI text via translations only.** UI is Polish-first. Never hard-code user-visible strings in components — add a key to `frontend/src/i18n/translations.ts` with both PL and EN values and use `t('key')`.
- **Build before commit.** Always run `npm run build` in `frontend/` (and the backend import check if backend changed) before committing. Do not commit a failing build.
- **Commit/push only after confirmation.** Commit and push directly to `main` only after the user confirms. Never force push.

## Project overview

GymTracker — web app for training plans, workout logging (sets/reps/weight with week-over-week progress) and body-weight tracking.

| Part | Stack | Deploy |
|---|---|---|
| `backend/` | FastAPI + SQLAlchemy 2 + PostgreSQL (psycopg2), JWT auth (python-jose), bcrypt | Render (`backend/render.yaml`, `Procfile`), auto-deploy on push to `main` |
| `frontend/` | React 19 + TypeScript + Vite, react-router-dom, axios, lucide-react | Vercel (`frontend/vercel.json` SPA rewrite), auto-deploy on push to `main` |

Pushing to `main` deploys both apps to production — there is no staging.

## Folder structure and key files

```
backend/
  app/
    main.py              # FastAPI app, CORS, routers, create_all + startup ALTER TABLE migrations
    config.py            # pydantic-settings (DATABASE_URL, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, FRONTEND_URL)
    database.py          # engine, SessionLocal, Base, get_db (rewrites postgres:// -> postgresql://)
    models/models.py     # ORM: User, TrainingPlan, PlanDay, Exercise, TrainingWeek,
                         #      TrainingDayLog, ExerciseLog, SetLog, WeightCycle, WeightWeek, WeightDayLog
    schemas/schemas.py   # Pydantic request/response schemas
    routers/             # auth.py, plans.py, weight.py, dashboard.py
    services/            # plan_service.py, dashboard_service.py, weight_service.py (business logic)
    auth/auth.py         # bcrypt hashing, JWT create/decode, get_current_user dependency
  requirements.txt, render.yaml, Procfile, runtime.txt (Python 3.11)

frontend/
  src/
    App.tsx              # routes: /login, /register, / (Dashboard), /create-plan, /plans, /weight
    pages/               # Dashboard, CreatePlan, MyPlans (plans -> weeks -> days -> workout logger),
                         # MyWeight, Login, Register
    components/Layout.tsx# navigation shell + language switch
    services/api.ts      # axios client (VITE_API_URL) + authApi, plansApi, planDaysApi,
                         # exercisesApi, logsApi, weightApi, dashboardApi
    i18n/translations.ts # TranslationMap interface + `pl` and `en` objects
    i18n/LanguageContext.tsx # useLanguage() -> { lang, setLang, t }; default 'pl'
    utils/progress.ts    # e1RM score, progress %, number formatting
    utils/repRange.ts    # rep range validation, payload, formatting
    hooks/useAuth.ts     # auth state (JWT in localStorage)
    types/index.ts       # shared TS types
```

### Adding a translation

1. Add the key to the `TranslationMap` interface.
2. Add the Polish value in `const pl`.
3. Add the English value in `const en`.

TypeScript enforces that both `pl` and `en` define every key, so `npm run build` catches a missing one.

## Build and checks

Frontend (required before every commit):

```bash
cd frontend
npm install        # first time only
npm run build      # tsc -b && vite build — type check + production build
npm run lint       # optional, eslint
```

Backend import check (when backend files change). Do not import `app.main`: on import it connects to the DB to run `create_all`/`ALTER TABLE`. Import the routers instead, with dummy env vars (`create_engine` does not connect):

```bash
cd backend
pip install -r requirements.txt   # first time only
DATABASE_URL=postgresql://u:p@localhost/x SECRET_KEY=x \
  python -c "import app.routers.auth, app.routers.plans, app.routers.weight, app.routers.dashboard; print('ok')"
```

Local dev: `uvicorn app.main:app --reload --port 8000` (backend, needs PostgreSQL + `backend/.env`) and `npm run dev` (frontend, http://localhost:5173).

## Adding new DB columns

There is no Alembic. `Base.metadata.create_all()` in `backend/app/main.py` creates missing tables but **does not add columns to existing tables**. New columns are added with idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements that run on every startup:

```python
with engine.begin() as conn:
    conn.execute(text("ALTER TABLE exercises ADD COLUMN IF NOT EXISTS rep_min INTEGER"))
    conn.execute(text("ALTER TABLE exercises ADD COLUMN IF NOT EXISTS rep_max INTEGER"))
```

To add a column:

1. Add the `Column(...)` to the model in `models/models.py`. Make it `nullable=True` (or give it a server default) so existing rows stay valid.
2. Append a matching `ALTER TABLE <table> ADD COLUMN IF NOT EXISTS <col> <TYPE>` line to the block in `main.py`.
3. Update the Pydantic schemas in `schemas/schemas.py`, plus services and routers as needed.
4. Update the frontend types in `types/index.ts` and `services/api.ts` if the API shape changes.

The migration runs automatically on Render's next deploy/startup.

## Progress formula (workout logger)

Implemented in `frontend/src/utils/progress.ts` and used in `pages/MyPlans.tsx`:

- **e1RM (Epley)** per set: `weight × (1 + reps / 30)`.
- **Exercise score** = average e1RM across all sets of the exercise (`exerciseScore`).
- Progress is shown **only when every set has both weight and reps**. If any set is missing a value, the score is `null` and no progress is shown.
- **Progress %** = `(current − reference) / reference × 100`, rounded to one decimal (`progressPct`). It is compared against the previous week and against week 1.
- **Format** (`formatPct`): one decimal with a comma as the decimal separator (pl-PL locale), dropping a trailing `,0` (e.g. `+2,5%`, `+3%`, `−1,2%`). Uses the true minus sign `−` for negative values.

## Mascot (Kulka) spec

Planned mascot changes are specified page by page in `docs/mascot-spec.md`, split into Stage A (sections 1, 2, 6, 7), Stage B (3, 4, 5) and Stage C (8, 9). Read it before working on the mascot (`frontend/src/components/mascot/`) and implement one stage at a time.

## Workout features spec

Planned workout features are specified in `docs/workout-features-spec.md`, split into Stage A (sections 1, 4, 5: rest timer, notes, RIR), Stage B (3, 6: exercise history + chart, deload week), Stage C (2: offline mode) and Stage D (7: rest timer push notifications). Read it before working on these features and implement one stage at a time.
