# SparkSuite Refactor Plan (Engine-First Migration)

## Goal
Move all logic out of UI into SparkCore engines.

---

## Phase 1: Identify UI Logic
Search and remove:
- lesson selection
- difficulty logic
- progression
- XP/rewards
- exercise generation

---

## Phase 2: Route Through SparkCore
All flows must go through:

```
SparkCore.startSession(user)
SparkCore.completeSession(results)
```

---

## Phase 3: SessionPlan Contract
All UI must consume a SessionPlan object.

---

## Phase 4: Engine Ownership
- CurriculumEngine → lessons
- PsychologyEngine → difficulty
- PracticeEngine → exercises
- ProgressEngine → XP/mastery

---

## Phase 5: Validation
- Remove all learning logic from UI
- Add test instrument without modifying core

---

## Done Criteria
- UI renders only
- Engines decide everything
