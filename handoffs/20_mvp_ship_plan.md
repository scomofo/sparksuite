# SparkSuite – 2 Week MVP Ship Plan (20)

## Goal
Ship a playable, testable MVP in 14 days using the existing system.

---

# WEEK 1 – CORE LOOP STABILIZATION

## Day 1–2: Full Loop Wiring
- Map → Gameplay → Results → Map
- Ensure orchestrator handles all transitions

## Day 3–4: Converter Validation
- Import 3 MIDI files
- Validate timing + chord mapping

## Day 5–6: Audio Sync
- Add backing track to 1 song
- Tune offset

## Day 7: Bug Fix Pass
- Input timing
- Lane accuracy
- Crash handling

---

# WEEK 2 – EXPERIENCE + INTELLIGENCE

## Day 8–9: Results Screen + Stars
- Accuracy
- Stars
- Continue button

## Day 10–11: AI Coach v2
- Hook event capture
- Show 1 message
- Implement reduce_speed

## Day 12: Progression Map
- Render nodes
- Show stars + recommended

## Day 13: Persistence

```js
localStorage.setItem("user", JSON.stringify(user));
```

## Day 14: Playtest + Polish
- Run full loop repeatedly
- Fix friction
- Remove clutter

---

# MVP DEFINITION

Must have:
- playable song
- results screen
- progression update
- next recommendation

Nice to have:
- AI coach
- audio sync

---

# LAUNCH CRITERIA

- loop runs without breaking
- feels responsive
- user understands what to do next

---

# WHY THIS MATTERS

This gets SparkSuite into real user hands quickly.
