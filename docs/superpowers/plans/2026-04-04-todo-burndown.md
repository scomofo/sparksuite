# SparkSuite TODO Burndown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate S.* as read source, move all timers into engine, thin bridges, migrate pages to core-first, expand content, add cloud sync UX, fix chart edge cases.

**Architecture:** SparkCore gains persistedState alongside runtimeState. All reads go through core. Bridges absorbed into core engines. New SparkTimerManager owns timer lifecycle.

**Tech Stack:** Vanilla JavaScript, localStorage, SparkCore engine, JSON chart files.

---

## Task 1: Add persistedState to SparkCore

**Files:**
- Modify: `js/sparksuite/core/spark_core.js:1-17`
- Modify: `js/state.js:300-490`
- Modify: `js/app.js` (sparkCore init section)

- [ ] **Step 1: Add persistedState to constructor**
- [ ] **Step 2: Add accessor methods** -- getPersistedState(), updatePersistedState(patch), p(key), r(key)
- [ ] **Step 3: Wire loadState** -- Loop PERSIST_FIELDS to copy S into sparkCore.persistedState
- [ ] **Step 4: Wire saveState** -- Sync sparkCore.persistedState back to S before save
- [ ] **Step 5: Hydrate after init** -- Copy PERSIST_FIELDS from S into sparkCore.persistedState
- [ ] **Step 6: Commit**

---

## Task 2: Create SparkTimerManager

**Files:**
- Create: `js/sparksuite/core/timer_manager.js`
- Modify: `js/sparksuite/core/spark_core.js` (constructor)

- [ ] **Step 1: Create timer_manager.js** -- constructor(core), _handles, callbacks, session/drill/daily tick loops, stopAll()
- [ ] **Step 2: Wire into SparkCore**
- [ ] **Step 3: Add script tag**
- [ ] **Step 4: Commit**

---

## Task 3: Delegate app.js timers to SparkTimerManager

**Files:**
- Modify: `js/app.js:1-158`
- Modify: `js/state.js:295`

- [ ] **Step 1: Replace tickS/tickD/tickDy** -- Thin shims delegating to timerManager
- [ ] **Step 2: Wire timerManager callbacks** -- render, sound, completion handlers
- [ ] **Step 3: Replace closeAllActivities** -- timerManager.stopAll()
- [ ] **Step 4: Reduce T to empty object**
- [ ] **Step 5: Commit**

---

## Task 4: Absorb progress_bridge into SparkCore

**Files:**
- Modify: `js/sparksuite/core/spark_core.js`
- Modify: `js/sparksuite/bridges/progress_bridge.js`

- [ ] **Step 1: Add progress methods** -- applyReward, applySessionOutcome, applyWeakSpotUpdate, applyAdaptiveUpdate, applyActivityCompletion on persistedState
- [ ] **Step 2: Thin the bridge** -- Each function forwards to sparkCore
- [ ] **Step 3: Commit**

---

## Task 5: Absorb performance_bridge into core

**Files:**
- Modify: `js/sparksuite/bridges/performance_bridge.js`

- [ ] **Step 1: Replace all S.* with persistedState**
- [ ] **Step 2: Delegate applyReward to core**
- [ ] **Step 3: Commit**

---

## Task 6: Migrate all pages to core-first reads

**Files:**
- Modify: `js/pages/*.js` (18 files)
- Modify: `js/instruments/piano/pages/*.js`

- [ ] **Step 1-10: Sweep each page file** -- Replace S.* reads with sparkCore.p() or sparkCore.r()
- [ ] **Step 11: Commit**

---

## Task 7: Add piano rhythm highway charts

**Files:**
- Create: `data/performance_charts/piano_gentle_walk.json` (72bpm C-Am-F-G)
- Create: `data/performance_charts/piano_soul_voicings.json` (84bpm Dm-G-C-Am)
- Create: `data/performance_charts/piano_ballad_flow.json` (66bpm F-C-G-Am-Em)
- Create: `data/performance_charts/piano_groove_drive.json` (96bpm G-D-Em-C-Am)

- [ ] **Step 1-4: Create each chart JSON** -- Match existing guitar chart structure
- [ ] **Step 5: Register in manifest**
- [ ] **Step 6: Commit**

---

## Task 8: Expand bass exercises

**Files:**
- Modify: `js/instruments/bass/data.js`

- [ ] **Step 1: Add 8 exercises** -- B-ROOT5(L3), B-WALK(L4), B-SYNC(L4), B-SLAP(L6), B-POP(L6), B-HAMMER(L5), B-PULL(L5), B-FUNK(L6)
- [ ] **Step 2: Commit**

---

## Task 9: Add ukulele performance charts

**Files:**
- Create: `data/performance_charts/uke_fingerpick_flow_package.json` (70bpm)
- Create: `data/performance_charts/uke_reggae_chop_package.json` (88bpm)
- Create: `data/performance_charts/uke_performance_medley_package.json` (82bpm)

- [ ] **Step 1-3: Create each chart** -- sparksuite_import_v1 format
- [ ] **Step 4: Commit**

---

## Task 10: Cloud sync UX

**Files:**
- Modify: `js/cloud/ui.js`, `js/cloud/sync.js`, `js/cloud/storage.js`

- [ ] **Step 1: Add lastModifiedAt timestamps to snapshot**
- [ ] **Step 2: Add conflict detection**
- [ ] **Step 3: Add resolveCloudConflict** -- local/cloud/newest strategies
- [ ] **Step 4: Enhance UI** -- spinner, timestamp, error/retry, conflict dialog
- [ ] **Step 5: Commit**

---

## Task 11: Fix imported chart edge cases

**Files:**
- Modify: `js/performance/chart.js`, `js/performance/highway.js`

- [ ] **Step 1: Multi-tempo BPM** -- Predominant BPM from longest segment
- [ ] **Step 2: Badge density** -- Group by technique when >6
- [ ] **Step 3: Phrase inference** -- From gaps >2s
- [ ] **Step 4: Audio-aware duration**
- [ ] **Step 5: Commit**

---

## Task 12: Update TODO and verify

- [ ] **Step 1: Mark TODO items complete**
- [ ] **Step 2: Smoke test**
- [ ] **Step 3: Commit**
