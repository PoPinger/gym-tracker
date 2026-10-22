# Mascot (Kulka) changes, page by page

Spec for the planned Kulka mascot changes. Implementation is split into three stages; each stage is implemented, built and shipped separately.

| Stage | Sections | Scope |
|---|---|---|
| **A** | 1, 2, 6, 7 | Parachute/rope swap, trash-can delete dialogs, plan weeks view barbell press, week days confetti |
| **B** | 3, 4, 5 | Excavator (Edytuj plan), crane (exercise editor), Moja waga Masa/Redukcja |
| **C** | 8, 9 | Towel throw (training day view), weight week notebook + stamp |

Section numbers below are the original spec numbers and are referenced across stages (e.g. section 5 reuses sections 2 and 3, section 9 reuses section 7).

---

## Stage A

### 1. STATYSTYKI

- Change the entrance: instead of sliding down a rope, Kulka floats down with a small parachute from the top of the screen and lands on the top-right corner of the calendar card (same spot as now). The parachute folds away after landing, then he idles.
- Administracja gets the rope entrance instead (swap the two).

### 2. DELETE CONFIRMATION DIALOGS

(e.g. "Usunąć plan?" in Moje plany, the "Zresetuj" confirmation in Moja waga, and every other delete/reset confirmation in the app)

- Kulka stands next to a small pixel trash can at the side of the dialog (inside the dialog or peeking over its edge, never covering the text or buttons), holding a small sheet of paper.
- While the dialog is open: he looks at the paper, then at the user, a little unsure (idle with a worried glance).
- "Anuluj": he quickly hides the paper behind his back and smiles, then the dialog closes.
- Confirm button (e.g. "Usuń plan", "Zresetuj"): he throws the paper into the trash can, the lid closes with a little bounce, then the dialog closes.
- Keep the animation short (~0.8 s) before the dialog closes; the action itself is not delayed or blocked by the animation. With prefers-reduced-motion: static pose, dialog closes immediately.

### 6. PLAN WEEKS VIEW

(inside a plan, e.g. "FBL/UL" with the week tiles)

- Kulka stands on top of the current week's tile ("Bieżący") and presses a barbell overhead in a loop, exactly like on the loading screen (chest → push → overhead → hold, ~1.5 s per rep).
- Entrance: he walks in carrying the barbell from the left side of the tile grid to the current week's tile, then starts pressing.
- If all weeks are completed, he stands on the progress card instead and celebrates (jumps for joy with the barbell overhead).
- Never covers the week number or status text.

### 7. WEEK DAYS VIEW

(e.g. "Tydzień 5" with the day cards)

- After finishing a single day ("Zakończ dzień", back on the day list): first Kulka jumps for joy a couple of times with a SMALL burst of pixel confetti around him (~1.5 s), then the existing "workout done" sequence (faster and faster curls → tired → sits to rest).
- After finishing the whole week ("Zakończ tydzień" after all days are done): he jumps for joy several times (~2–3 s) with a BIG burst of pixel confetti falling over the whole day list, then idles happily.
- Confetti in the app colors, never blocks clicks (pointer-events: none) and disappears completely after ~3 s. With prefers-reduced-motion: no confetti, static happy pose.

---

## Stage B

### 3. EDYTUJ PLAN

- Entrance: a small pixel excavator drives in from the left along the top edge of the edit card, carrying Kulka in its bucket. It stops at the top-right of the card, lowers the bucket, Kulka jumps out (already wearing a yellow construction helmet and holding a clipboard with a pencil). The excavator then drives off to the right and disappears exactly at the right edge of the card (clipped by the card, not leaving it). Whole entrance ~2.5 s.
- Spot: top-right of the edit card, never covering inputs.
- Idle: he writes on the clipboard, occasionally looks up and taps the pencil on his chin.
- While I'm typing or changing anything in the form (name, duration, day names, opening exercises): he writes faster.
- "Zapisz zmiany": he stamps the clipboard with a green checkmark and gives a thumbs up.
- "Anuluj": he shrugs and tucks the clipboard under his arm.

### 4. EXERCISE EDITOR OF A TRAINING DAY

(e.g. "Lower A – Edytuj ćwiczenia dnia treningowego")

- Entrance: a small pixel crane hook comes down from the top of the screen with Kulka hanging by his harness (wearing the yellow helmet). It lowers him next to the day title, he unhooks himself, and the hook goes back up and disappears. ~2 s.
- Spot: next to the title / on the top edge of the exercise list, never covering rows or buttons.
- Idle: he sits on the list and checks the exercises with a pencil, ticking them off one by one.
- "Dodaj ćwiczenie": he runs to the dashed "Dodaj ćwiczenie" button and carries back a pixel "brick", which turns into the new exercise row.
- Moving an exercise up/down: he pushes the row in that direction.
- Deleting an exercise: he kicks it into the trash can (the same trash can as in the delete dialogs, section 2).
- "Gotowe": he wipes the sweat off his forehead and gives a thumbs up.
- None of these animations delay or block the actual actions.

### 5. MOJA WAGA

- Keep the current ride along the chart line (sliding down on drops, climbing on rises, walking on flat parts, in sync with the line draw).
- When he reaches the last point, he jumps up from the chart to the "Masa / Redukcja" toggle at the top of the page and stands on top of it (never covering the buttons' labels), then idles there.
- Clicking "Masa": he puffs up and becomes big and round (inflates, ~0.6 s), holds for a moment, then deflates back to his normal shape.
- Clicking "Redukcja": he becomes super thin and tall (~0.6 s), holds for a moment, then returns to his normal shape.
- "Edytuj" (cycle duration): use the same excavator entrance and helmet + clipboard behavior as in section 3 (Edytuj plan) inside the edit sheet/form: writing while I change the duration, stamp + thumbs up on save, shrug on cancel.
- "Zresetuj": the trash-can dialog from section 2.

---

## Stage C

### 8. TRAINING DAY VIEW

(workout logger, Kulka in the bottom "Zakończ dzień" bar)

- Turning on "Trening pominięty": Kulka gets annoyed (frowns, stomps his foot) and throws a small pixel towel toward the screen: it flies at the user, growing bigger as if coming out of the screen, "hits" the glass with a small bounce/flatten effect, then slides down and fades out (~1.2 s total). Then he sits bored with his head on his hand (existing skipped pose).
- Turning it off again: he stands up and gets back to idle.
- Turning on "Ćwiczenie pominięte" for a single exercise: a lighter reaction, he shakes his head and wags his finger once (~0.8 s).
- The towel never blocks clicks (pointer-events: none) and is only played when I switch the toggle on, not when opening an already skipped day. With prefers-reduced-motion: no throw, just the bored pose.

### 9. WEIGHT WEEK VIEW

(e.g. "Tydzień 9" with "Dzienne odczyty" Pon–Nd)

- Spot: top-right corner of the "Dzienne odczyty" card, never covering the day tiles or inputs.
- Idle (background loop): he writes the result in a small notebook, then puts it in his pocket, looks around, and repeats after a while.
- Confirming a day (the ✓ button on a day tile): he runs to that day's tile, stamps it with a green checkmark stamp (the tile turns green as it already does), then runs back to his spot. The save itself is not delayed by the animation.
- "Zakończ tydzień": the same celebration as in section 7: jumps for joy several times with a BIG burst of pixel confetti over the card (~2–3 s), then idles happily.
- With prefers-reduced-motion: no running/confetti, static poses.
