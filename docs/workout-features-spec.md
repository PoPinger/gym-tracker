# New workout features

Spec for new workout features in GymTracker. Mobile-first, Polish UI text via translations, consistent with the current design and the Kulka mascot. Implementation is split into four stages; each stage is implemented, built and shipped separately.

| Stage | Sections | Scope |
|---|---|---|
| **A** | 1, 4, 5 | Rest timer (in-app), persistent exercise notes, RIR |
| **B** | 3, 6 | Exercise history + chart, deload week |
| **C** | 2 | Offline mode |
| **D** | 7 | Push notifications for the rest timer |

Section numbers below are the original spec numbers and are referenced across stages (e.g. section 7 builds on section 1, section 2 covers the notes from section 4).

---

## Stage A

### 1. REST TIMER

- Each exercise in a plan gets its own rest time (e.g. 0:30–5:00, default 2:00), editable in the exercise editor of a training day (same row as Serie / Zakres). Backend: nullable `rest_seconds` on the plan exercise (same startup `ALTER TABLE ... IF NOT EXISTS` approach), saved in create/update/copy plan.
- In the workout logger each set row gets a small ✓ button "Zapisz serię". Tapping it saves that set (reps; weight from the exercise) and starts the rest timer for that exercise. No timer after the LAST set of an exercise. The existing per-exercise "Zapisz" keeps working.
- Timer UI: a compact countdown (e.g. "Przerwa 1:42") pinned in the bottom "Zakończ dzień" bar next to Kulka, with "+30 s" and "Pomiń" buttons. Only one timer at a time; a new set restarts it.
- The timer is based on an end timestamp (not a ticking counter), so it stays correct after switching apps or locking the screen.
- While resting: Kulka sits and drinks water from a bottle.
- When the time is up: vibration (`navigator.vibrate`, where supported), a short sound if allowed, and a speech bubble next to Kulka: "Zacznij serię!" (he stands up, ready). The bubble disappears when I save the next set or tap it.
- If I come back to the app after the timer ended in the background, show the "Zacznij serię!" state immediately.

### 4. NOTES (persistent)

- Each exercise gets a note field (e.g. "siedzenie na 4", "bolał bark") in the logger, collapsed under a small "Notatka" button with a preview when not empty.
- The note is permanent for that plan exercise: it shows every week until I edit or delete it myself (not per week). Backend: nullable `note` on the plan exercise.

### 5. RIR

- Optional RIR field per set (0–5, small selector next to the reps input). Saved per set, shown in the previous-week column and in the history. Backend: nullable `rir` on the set log.
- RIR doesn't change the progress formula.

---

## Stage B

### 3. EXERCISE HISTORY + CHART

- Tapping an exercise name in the logger (and in the exercise editor) opens a sheet "Historia ćwiczenia".
- Line chart of e1RM per week (same Epley formula and the existing line-draw animation), with the best week marked.
- Below: list of all logged weeks for this exercise: date, weight, reps per set, RIR if set, note, deload/skipped markers.
- Matches the exercise by plan exercise; if the same exercise name exists in other plans, offer a toggle "Pokaż ze wszystkich planów".

### 6. DELOAD WEEK

- In the week days view, above the day cards, a checkbox "Tydzień deload". Checking it marks the whole week as deload; unchecking reverts it fully. Backend: boolean `is_deload` on the training week.
- Deload weeks: shown with a distinct calm color/badge "Deload" in the weeks grid and day views.
- Deload weeks are excluded from: progress comparisons (vs previous week / vs week 1 use the last non-deload week), the "Zwiększ ciężar" hint, records, and streak breaking. Unchecking makes them count again immediately.
- Kulka in a deload week: relaxed pose (e.g. light stretching).

---

## Stage C

### 2. OFFLINE MODE

- Workout logging must work without internet: saving sets/exercises, finishing a day, skip toggles, notes, weight entries.
- Changes are stored on the device (IndexedDB) in a queue and sent automatically, in order, when the connection is back. Show a small status: "Offline – zapisano na telefonie" / "Synchronizacja…" / "Zsynchronizowano".
- The current plan, week and day data are cached so the logger opens offline.
- Handle conflicts safely (last write wins per set, never lose a set). Never show raw errors.
- Service worker for app shell caching (works with the existing manifest / home-screen app).

---

## Stage D

### 7. PUSH NOTIFICATIONS FOR THE REST TIMER

- When a rest timer starts, the backend schedules a Web Push notification for its end time with the title "Zacznij serię!" and the body with the exercise and next set, e.g. "Dumbbell Press – seria 2 z 3". Cancelled if I skip/restart the timer or save the next set earlier.
- Web Push with VAPID keys (env variables on Render, never committed), subscription stored per user/device, a "Powiadomienia o przerwie" toggle in settings that asks for permission.
- iPhone: works only when the app is added to the home screen (iOS 16.4+); show a short hint about that in the settings toggle.
- Fallback without permission: the in-app timer from section 1.
