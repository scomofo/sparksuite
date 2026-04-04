# SparkSuite TODO Burndown -- Design Spec

**Date:** 2026-04-04
**Scope:** Full migration of P2 architectural debt, P1 content expansion, P3 polish
**Approach:** Big bang per subsystem, P2 first, then P1, then P3

---

## P2 -- Architectural (Full Migration)

### P2.1 -- Reduce S.* Dependence

**Goal:** All flows read core runtimeState/persistedState as source of truth. S.* becomes a thin localStorage adapter only.

**Changes:**

1. **Add persistedState to SparkCore.** The 92 PERSIST_FIELDS currently in S.* move into sparkCore.persistedState. Core loads from localStorage on init via loadState(), and saveState() serializes from persistedState.

2. **Sweep all consumers.** Every page, flow, and bridge that reads S.someField is rewritten to read from sparkCore.runtimeState (transient) or sparkCore.persistedState (durable).

3. **Kill S.* reads.** After sweep, S is reduced to a thin adapter in state.js: loadState() hydrates sparkCore.persistedState, saveState() serializes it. No code outside state.js touches S.*.

4. **Delete duplicated fields.** S.* fields already mirrored in runtimeState (legacy* prefix fields) are removed from S.

**Execution:** Big bang per file.

### P2.2 -- Move Live Loops Into Engine

**Goal:** All timers/intervals in global T object move into SparkCore ownership.

**Changes:**

1. **Create SparkTimerManager** at js/sparksuite/core/timer_manager.js.
2. **Move tick logic into core:** tickS/tickD/tickDy and interval timers.
3. **app.js becomes thin dispatcher.**
4. **Tick -> runtimeState -> render.**

**Depends on:** P2.1

### P2.3 -- Thin Bridge Layers

**Goal:** Bridges become stateless one-line forwards or are deleted entirely.

**Changes:**

1. **Absorb logic into core engines.**
2. **Delete format conversion.**
3. **Remaining bridge files** become thin re-exports or deleted.

**Depends on:** P2.1, P2.2

### P2.4 -- Pages Core-First

**Goal:** All page files read exclusively from core state.

**Changes:**

1. **Remove fallbacks.**
2. **Migrate remaining pages.**
3. **Render signal via sparkCore.updateRuntimeState().**
4. **Instrument pages** follow same pattern.

**Depends on:** P2.1, P2.3

---

## P1 -- Content Expansion

### P1.1 -- Piano Rhythm Highway Charts (2 -> 6)

4 new charts: piano_gentle_walk (72bpm), piano_soul_voicings (84bpm), piano_ballad_flow (66bpm), piano_groove_drive (96bpm).

### P1.2 -- Bass Exercises (8 -> 16)

8 new: B-ROOT5, B-WALK, B-SYNC, B-SLAP, B-POP, B-HAMMER, B-PULL, B-FUNK.

### P1.3 -- Ukulele Performance Charts (3 -> 6)

3 new: uke_fingerpick_flow, uke_reggae_chop, uke_performance_medley.

---

## P3 -- Polish

### P3.1 -- Cloud Sync UX

Progress indicator + conflict resolution with per-category timestamps.

### P3.2 -- Imported Chart Edge Cases

Multi-tempo, badge density, phrase inference, lane clamping, audio-aware duration.

---

## Execution Order

1. P2.1 -- Reduce S.* dependence (foundation)
2. P2.2 -- Move live loops into engine
3. P2.3 -- Thin bridge layers
4. P2.4 -- Pages core-first
5. P1.1 -- Piano rhythm highway charts
6. P1.2 -- Bass exercises
7. P1.3 -- Ukulele performance charts
8. P3.1 -- Cloud sync UX
9. P3.2 -- Imported chart edge cases
