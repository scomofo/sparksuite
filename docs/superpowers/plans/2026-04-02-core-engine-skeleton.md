# SparkSuite Core Engine Skeleton — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a SparkCore orchestrator that builds sessions from CurriculumEngine + PsychologyEngine + PracticeEngine, replacing the current pattern where UI pages directly assemble session state.

**Architecture:** SparkCore sits between the UI and the existing scattered logic. It wraps existing code (spark-core/, curriculum/, progression/, meta/) into a unified API. One guitar practice session is routed through SparkCore as proof-of-concept. The UI calls `SparkCore.startSession()` instead of directly mutating `S` state.

**Tech Stack:** Vanilla JavaScript (ES5, no modules — loaded via script tags, IIFE pattern, window globals). Existing codebase uses `window.SparkCore`, `window.SparkProgress`, `window.SparkInstruments`, etc.

**Spec:** `docs/superpowers/specs/2026-04-01-sparksuite-convergence-design.md` + handoff docs in Downloads

---

## File Structure

| File | Responsibility | Status |
|------|---------------|--------|
| `js/spark-core/index.js` | Barrel/namespace — expose all engines | Exists, extend |
| `js/spark-core/session-engine.js` | Build sessions, process results | **Create** |
| `js/spark-core/curriculum-engine.js` | Get next lesson, skill sequencing | **Create** (wraps existing `js/curriculum/curriculum_engine.js`) |
| `js/spark-core/psychology-engine.js` | Reward schedule, difficulty, flow | **Create** (wraps existing `shouldFireReward`, `buildAdaptiveDecision`) |
| `js/spark-core/practice-engine.js` | Generate exercises, analyze performance | **Create** (wraps existing `js/performance/scoring.js`) |
| `js/spark-core/progress-engine.js` | XP, mastery, streaks, unlocks | Exists — extend |
| `js/spark-core/instrument-adapter.js` | Bridge SparkInstruments → core engine | **Create** |
| `js/app.js` | Session completion flow | Modify — delegate to SparkCore |
| `js/instruments/guitar/app.js` | Guitar act handler | Modify — use SparkCore for session start |
| `index.html` | Script tags | Modify — add new scripts |

---

### Task 1: Create SessionEngine

**Files:**
- Create: `js/spark-core/session-engine.js`

- [ ] **Step 1: Create the SessionEngine IIFE**

```javascript
// js/spark-core/session-engine.js
// Builds practice sessions and processes results.
// Replaces direct S-state mutation in act() handlers.
(function() {

  var SparkSession = {

    /**
     * Build a session plan for the active instrument.
     * @param {object} opts - { instrument, level, mode }
     *   instrument: SparkInstruments registration object
     *   level: current player level (1-8)
     *   mode: "quickStart" | "guided" | "drill" | "chord"
     * @returns {object} session plan
     */
    buildSession: function(opts) {
      opts = opts || {};
      var inst = opts.instrument || SparkInstruments.getActive();
      if (!inst) return null;

      var D = inst.getData();
      var level = opts.level || S.level || 1;
      var mode = opts.mode || "quickStart";

      if (mode === "quickStart") {
        return this._buildQuickStart(D, level);
      }
      if (mode === "guided") {
        return this._buildGuided(D, opts.sessionNum || S.guidedSession || 1);
      }
      if (mode === "chord") {
        return this._buildChordSession(D, opts.chordName);
      }
      if (mode === "drill") {
        return this._buildDrill(D, level);
      }

      return this._buildQuickStart(D, level);
    },

    _buildQuickStart: function(D, level) {
      var avail = D.CHORDS[level] || D.CHORDS[1] || [];
      if (!avail.length) return null;
      var chord = avail[Math.floor(Math.random() * avail.length)];
      return {
        type: "quickStart",
        chord: chord,
        chordName: chord.name || chord.short || "unknown",
        duration: 120,
        level: level
      };
    },

    _buildGuided: function(D, sessionNum) {
      var sessions = D.SESSIONS || [];
      var plan = sessions[sessionNum - 1];
      if (!plan) return null;
      return {
        type: "guided",
        plan: plan,
        sessionNum: sessionNum,
        duration: 300,
        level: plan.level || 1
      };
    },

    _buildChordSession: function(D, chordName) {
      var chord = null;
      var all = D.ALL_CHORDS || [];
      for (var i = 0; i < all.length; i++) {
        if (all[i].name === chordName || all[i].short === chordName) {
          chord = all[i]; break;
        }
      }
      if (!chord) return null;
      return {
        type: "chord",
        chord: chord,
        chordName: chord.name,
        duration: 120,
        level: S.level || 1
      };
    },

    _buildDrill: function(D, level) {
      var av = D.CHORDS[level] || D.CHORDS[1] || [];
      if (av.length < 2) return null;
      var c1 = av[Math.floor(Math.random() * av.length)];
      var c2 = c1, n = 0;
      while (c2.name === c1.name && av.length > 1 && n < 20) {
        c2 = av[Math.floor(Math.random() * av.length)]; n++;
      }
      return {
        type: "drill",
        chords: [c1, c2],
        duration: 60,
        level: level
      };
    },

    /**
     * Process session completion results.
     * Updates mastery, XP, streak, level, badges.
     * @param {object} results - { type, chordName, duration, accuracy }
     * @returns {object} outcome - { xpEarned, jackpot, leveledUp, newLevel, newBadges, streakUpdated }
     */
    processResults: function(results) {
      results = results || {};
      var outcome = {
        xpEarned: 0,
        jackpot: false,
        leveledUp: false,
        newLevel: S.level,
        newBadges: [],
        streakUpdated: false
      };

      // 1. Streak (once per day)
      var today = new Date().toISOString().slice(0, 10);
      if (S.lastSessionDate !== today) {
        S.streak = (S.streak || 0) + 1;
        S.lastSessionDate = today;
        outcome.streakUpdated = true;
      }

      // 2. Session count
      S.sessions = (S.sessions || 0) + 1;

      // 3. XP with jackpot (1-in-15)
      var jackpot = Math.random() < (1 / 15);
      outcome.xpEarned = jackpot ? 50 : 10;
      outcome.jackpot = jackpot;
      S.xp = (S.xp || 0) + outcome.xpEarned;

      // 4. Chord mastery (+34 per session, capped at 100)
      if (results.chordName && S.chordProgress) {
        var k = results.chordName;
        S.chordProgress[k] = Math.min((S.chordProgress[k] || 0) + 34, 100);
      }

      // 5. Level-up check (all chords at level mastered?)
      var inst = SparkInstruments.getActive();
      if (inst) {
        var D = inst.getData();
        var chords = D.CHORDS[S.level] || [];
        var allMastered = true;
        for (var i = 0; i < chords.length; i++) {
          if ((S.chordProgress[chords[i].name] || 0) < 100) {
            allMastered = false; break;
          }
        }
        if (allMastered && S.level < 8) {
          S.level++;
          outcome.leveledUp = true;
          outcome.newLevel = S.level;
        }
      }

      // 6. Log history
      if (typeof logHistory === "function") {
        logHistory("session", results.chordName || "practice", outcome.xpEarned);
      }

      // 7. Emit suite event
      if (typeof _sparkEmit === "function") {
        _sparkEmit("practice_session_completed", {
          appId: inst ? inst.id : "unknown",
          type: results.type || "session",
          xp: outcome.xpEarned,
          chord: results.chordName
        });
      }

      // 8. Badge check
      if (typeof checkBadges === "function") {
        checkBadges();
        // TODO: capture newly earned badges into outcome.newBadges
      }

      // 9. Persist
      if (typeof saveState === "function") saveState();

      return outcome;
    }
  };

  window.SparkSession = SparkSession;
})();
```

- [ ] **Step 2: Commit**

```bash
git add js/spark-core/session-engine.js
git commit -m "feat(core): create SparkSession engine with buildSession and processResults"
```

---

### Task 2: Create PsychologyEngine

**Files:**
- Create: `js/spark-core/psychology-engine.js`

- [ ] **Step 1: Create the PsychologyEngine IIFE**

This wraps the existing `shouldFireReward()` (app.js:4-10) and `buildAdaptiveDecision()` (progression/adaptive.js) into a clean API.

```javascript
// js/spark-core/psychology-engine.js
// Handles reward scheduling, adaptive difficulty, flow management.
(function() {

  var SparkPsychology = {

    /**
     * Should a reward be fired right now?
     * Uses variable reinforcement schedule that thins over time.
     * @param {number} sessionCount - total sessions completed
     * @returns {boolean}
     */
    shouldReward: function(sessionCount) {
      var n = sessionCount || S.sessions || 0;
      if (n <= 5)  return true;                    // Phase 1: continuous
      if (n <= 14) return Math.random() < 0.33;    // Phase 2: VR-3
      if (n <= 30) return Math.random() < 0.14;    // Phase 3: VR-7
      return Math.random() < 0.10;                 // Phase 4: VR-10
    },

    /**
     * Get the current reward phase info.
     * @param {number} sessionCount
     * @returns {object} { phase, probability, name }
     */
    getRewardPhase: function(sessionCount) {
      var n = sessionCount || S.sessions || 0;
      if (n <= 5)  return { phase: 1, probability: 1.0,  name: "Continuous" };
      if (n <= 14) return { phase: 2, probability: 0.33, name: "Variable (VR-3)" };
      if (n <= 30) return { phase: 3, probability: 0.14, name: "Variable (VR-7)" };
      return { phase: 4, probability: 0.10, name: "Variable (VR-10)" };
    },

    /**
     * Should a jackpot bonus be awarded?
     * @returns {boolean}
     */
    shouldJackpot: function() {
      return Math.random() < (1 / 15);
    },

    /**
     * Get adaptive difficulty decision.
     * Delegates to existing buildAdaptiveDecision() if available.
     * @param {object} context - { targetType, accuracy, successStreak, currentValue, ... }
     * @returns {object} { targetType, difficultyAction, currentValue, nextValue, reason }
     */
    getAdaptiveDifficulty: function(context) {
      if (typeof buildAdaptiveDecision === "function") {
        return buildAdaptiveDecision(context);
      }
      return {
        targetType: context.targetType || "generic",
        difficultyAction: "keep",
        currentValue: context.currentValue || 0,
        nextValue: context.currentValue || 0,
        reason: "Adaptive engine not loaded"
      };
    },

    /**
     * Get session structure template.
     * Based on instrument and session type.
     * @param {string} instrumentType - "guitar" | "piano" | "bass"
     * @returns {string[]} segment names
     */
    getSessionStructure: function(instrumentType) {
      if (instrumentType === "bass") {
        return ["spark", "reviewGroove", "technique", "grooveDrill", "songGroove", "victoryGroove"];
      }
      // Default (guitar/piano)
      return ["spark", "review", "newMove", "songSlice", "victoryLap"];
    },

    /**
     * Check if a micro-reward should fire at this moment.
     * @param {string} id - micro-reward ID
     * @param {string[]} alreadyFired - IDs already fired this session
     * @returns {boolean}
     */
    shouldFireMicro: function(id, alreadyFired) {
      alreadyFired = alreadyFired || [];
      return alreadyFired.indexOf(id) === -1;
    },

    /**
     * Get comeback bonus XP for returning after absence.
     * @param {string} lastDate - ISO date of last session
     * @returns {number} bonus XP (0 if no absence)
     */
    getComebackBonus: function(lastDate) {
      if (!lastDate) return 0;
      var last = new Date(lastDate);
      var now = new Date();
      var days = Math.floor((now - last) / 86400000);
      if (days >= 3 && days < 7) return 20;
      if (days >= 7 && days < 30) return 50;
      if (days >= 30) return 80;
      return 0;
    }
  };

  window.SparkPsychology = SparkPsychology;
})();
```

- [ ] **Step 2: Commit**

```bash
git add js/spark-core/psychology-engine.js
git commit -m "feat(core): create SparkPsychology engine with reward scheduling and adaptive difficulty"
```

---

### Task 3: Create InstrumentAdapter

**Files:**
- Create: `js/spark-core/instrument-adapter.js`

- [ ] **Step 1: Create the InstrumentAdapter IIFE**

This bridges SparkInstruments (the existing registry from yesterday's convergence) to the core engine's expected interface.

```javascript
// js/spark-core/instrument-adapter.js
// Bridges SparkInstruments registry to SparkCore engine interface.
(function() {

  var SparkInstrumentAdapter = {

    /**
     * Get the active instrument's curriculum data.
     * @returns {object|null} { chords, sessions, songs, levels, skillTree }
     */
    getCurriculum: function() {
      var inst = SparkInstruments.getActive();
      if (!inst) return null;
      var D = inst.getData();
      return {
        chords: D.CHORDS || {},
        allChords: D.ALL_CHORDS || [],
        sessions: D.SESSIONS || [],
        songs: D.SONGS || [],
        levels: D.LC ? Object.keys(D.LC).length : 8,
        levelColors: D.LC || {},
        levelNames: D.LN || {},
        curriculum: D.CURRICULUM || []
      };
    },

    /**
     * Get the active instrument type.
     * @returns {string} "guitar" | "piano" | "bass" | null
     */
    getInstrumentType: function() {
      var inst = SparkInstruments.getActive();
      return inst ? (inst.instrument || null) : null;
    },

    /**
     * Get the active instrument ID.
     * @returns {string|null} "chordspark" | "pianospark" | etc.
     */
    getAppId: function() {
      var inst = SparkInstruments.getActive();
      return inst ? inst.id : null;
    },

    /**
     * Get instrument-specific session structure.
     * @returns {string[]}
     */
    getSessionStructure: function() {
      var type = this.getInstrumentType();
      return SparkPsychology.getSessionStructure(type);
    }
  };

  window.SparkInstrumentAdapter = SparkInstrumentAdapter;
})();
```

- [ ] **Step 2: Commit**

```bash
git add js/spark-core/instrument-adapter.js
git commit -m "feat(core): create SparkInstrumentAdapter bridge between registry and core engine"
```

---

### Task 4: Update SparkCore Barrel (index.js)

**Files:**
- Modify: `js/spark-core/index.js`

- [ ] **Step 1: Extend the SparkCore namespace with new engines**

```javascript
// js/spark-core/index.js
// Barrel — all spark-core modules are loaded as individual scripts.
// This file exists as a namespace convenience and suite version marker.
(function() {
  window.SparkCore = {
    version: "0.2.0",
    Profile: window.SparkProfile,
    Storage: window.SparkStorage,
    Events: window.SparkEvents,
    Progress: window.SparkProgress,
    Achievements: window.SparkAchievements,
    Content: window.SparkContent,
    ContentNormalizer: window.SparkContentNormalizer,
    // New engines
    Session: window.SparkSession,
    Psychology: window.SparkPsychology,
    InstrumentAdapter: window.SparkInstrumentAdapter
  };
})();
```

- [ ] **Step 2: Commit**

```bash
git add js/spark-core/index.js
git commit -m "feat(core): register new engines in SparkCore barrel namespace"
```

---

### Task 5: Add Script Tags to index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Find the existing spark-core script tags and add new ones**

Find the block of spark-core script tags in index.html. Add the new engine scripts BEFORE `index.js` (since index.js references them):

```html
<!-- After existing spark-core scripts, before index.js -->
<script src="js/spark-core/session-engine.js"></script>
<script src="js/spark-core/psychology-engine.js"></script>
<script src="js/spark-core/instrument-adapter.js"></script>
<!-- index.js must be last in spark-core block -->
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat(core): add new engine script tags to index.html"
```

---

### Task 6: Route Guitar quickStart Through SparkSession

**Files:**
- Modify: `js/instruments/guitar/app.js` (quickStart action)

- [ ] **Step 1: Replace the quickStart action to use SparkSession.buildSession**

In `js/instruments/guitar/app.js`, find the `if (a === "quickStart")` block (lines 7-12) and replace it:

```javascript
  if (a === "quickStart") {
    var session = SparkSession.buildSession({ mode: "quickStart", level: S.level });
    if (!session) return true;
    S.sessionMicros = [];
    S.lastChordName = session.chordName;
    snd("start");
    S.currentChord = session.chord;
    S.timer = session.duration;
    S.timerActive = true;
    S.selectedVoicing = 0;
    S.screen = SCR.SESSION;
    render();
    clearTimeout(T.session);
    T.session = setTimeout(tickS, 1000);
    saveState();
    return true;
  }
```

The key change: chord selection moved from inline `D.CHORDS[S.level]` logic to `SparkSession.buildSession()`.

- [ ] **Step 2: Verify guitar quickStart still works**

Open browser, select Guitar, click "Let's Go!" / Quick Start. Should start a session with a random chord.

- [ ] **Step 3: Commit**

```bash
git add js/instruments/guitar/app.js
git commit -m "feat(guitar): route quickStart through SparkSession.buildSession"
```

---

### Task 7: Route Session Completion Through SparkSession

**Files:**
- Modify: `js/app.js` (session completion in `tickS`)

- [ ] **Step 1: Find the session completion block in tickS**

In `js/app.js`, find the `tickS` function's completion block (where `S.timer <= 0`). This is the `else if(S.timerActive && S.timer <= 0)` branch around lines 20-42.

Replace the manual XP/streak/level/badge logic with a call to `SparkSession.processResults()`:

```javascript
  } else if(S.timerActive && S.timer <= 0) {
    S.timerActive = false;
    clearTimeout(T.session);
    if(S.metronomeOn) stopMetronome();
    if(S.chordDetectOn) stopChordDetect();

    // Delegate to SparkSession for all completion logic
    var outcome = SparkSession.processResults({
      type: "session",
      chordName: S.currentChord ? S.currentChord.name : null,
      duration: 120
    });

    // UI feedback based on outcome
    S.xpToast = { amount: outcome.xpEarned, time: Date.now(), jackpot: outcome.jackpot };
    if (outcome.jackpot) { snd("levelup"); }
    else { snd("complete"); }
    if (outcome.leveledUp) { snd("levelup"); }

    trigC();
    S.screen = SCR.COMPLETE;
    render();
  }
```

- [ ] **Step 2: Verify session completion still works**

Start a guitar session, wait for timer to reach 0 (or click Done). Verify:
- XP toast shows
- Chord progress updates
- Session counter increments
- Completion screen shows

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat(core): route session completion through SparkSession.processResults"
```

---

### Task 8: Route Guitar Drill Through SparkSession

**Files:**
- Modify: `js/instruments/guitar/app.js` (startDrill action)

- [ ] **Step 1: Replace the startDrill action to use SparkSession.buildSession**

In `js/instruments/guitar/app.js`, find the `if (a === "startDrill")` block and replace:

```javascript
  if (a === "startDrill") {
    var session = SparkSession.buildSession({ mode: "drill", level: S.level });
    if (!session) return true;
    S.drillChords = session.chords;
    S.drillIdx = 0;
    S.drillTimer = session.duration;
    S.drillSwitches = 0;
    S.drillLastSwitchTime = Date.now();
    S.drillAdaptiveBpm = 60;
    S.drillConsecutiveFast = 0;
    S.drillConsecutiveSlow = 0;
    if (typeof _prevChordKey !== "undefined") _prevChordKey = session.chords[0].name;
    snd("start");
    S.screen = SCR.DRILL;
    render();
    T.drill = setTimeout(tickD, 1000);
    return true;
  }
```

- [ ] **Step 2: Replace the startSession (chord) action**

Find `if (a === "startSession")` and replace:

```javascript
  if (a === "startSession") {
    var session = SparkSession.buildSession({ mode: "chord", chordName: v });
    if (!session) return true;
    S.sessionMicros = [];
    S.lastChordName = session.chordName;
    snd("start");
    S.currentChord = session.chord;
    S.timer = session.duration;
    S.timerActive = true;
    S.selectedVoicing = 0;
    if (typeof _prevChordKey !== "undefined") _prevChordKey = session.chordName;
    S.screen = SCR.SESSION;
    render();
    clearTimeout(T.session);
    T.session = setTimeout(tickS, 1000);
    saveState();
    return true;
  }
```

- [ ] **Step 3: Replace the resumeSession action**

Find `if (a === "resumeSession")` and replace:

```javascript
  if (a === "resumeSession") {
    var session = SparkSession.buildSession({ mode: "chord", chordName: S.lastChordName });
    if (!session) { act("quickStart"); return true; }
    S.sessionMicros = [];
    snd("start");
    S.currentChord = session.chord;
    S.timer = session.duration;
    S.timerActive = true;
    S.selectedVoicing = 0;
    if (typeof _prevChordKey !== "undefined") _prevChordKey = session.chordName;
    S.screen = SCR.SESSION;
    render();
    clearTimeout(T.session);
    T.session = setTimeout(tickS, 1000);
    return true;
  }
```

- [ ] **Step 4: Verify all three modes work**

Test: quickStart, click a specific chord to start session, drill. All should function identically.

- [ ] **Step 5: Commit**

```bash
git add js/instruments/guitar/app.js
git commit -m "feat(guitar): route drill/chord/resume sessions through SparkSession"
```

---

### Task 9: Route Reward Timing Through SparkPsychology

**Files:**
- Modify: `js/app.js` (tickS reward logic)

- [ ] **Step 1: Replace shouldFireReward with SparkPsychology.shouldReward**

In `js/app.js`, find the `tickS` function. Replace the reward check at the 30-second interval:

Old pattern:
```javascript
if(S.timer%30===0&&S.timer>0&&shouldFireReward()){
```

New pattern:
```javascript
if(S.timer%30===0&&S.timer>0&&SparkPsychology.shouldReward(S.sessions)){
```

- [ ] **Step 2: Remove the old shouldFireReward function**

Find `function shouldFireReward()` in app.js (around lines 4-10) and delete it. SparkPsychology now owns this logic.

- [ ] **Step 3: Verify reward toasts still fire during sessions**

Start a session, watch for XP toasts at 30-second intervals.

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "feat(core): route reward timing through SparkPsychology.shouldReward"
```

---

### Task 10: Verify End-to-End Flow

**Files:** None (manual verification)

- [ ] **Step 1: Test guitar full flow**

1. Open app in browser
2. Select Guitar from launcher
3. Click Quick Start → session starts with random chord
4. Wait or click Done → session completes, XP toast shows
5. Verify chord progress increased
6. Start a drill → two chords shown
7. Click a specific chord in practice tab → session starts with that chord
8. Navigate to other tabs (songs, games) → no errors

- [ ] **Step 2: Test piano still works**

1. Go back to launcher
2. Select Piano
3. Click through practice tab → no errors
4. Start a session → works

- [ ] **Step 3: Check console for errors**

Open F12 console. Navigate through both instruments. No errors should appear.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve any issues found during end-to-end verification"
```

---

## What This Plan Does NOT Cover (Future Plans)

- **Plan 2 (Progression System):** Decompose ProgressEngine into XP/level/mastery/unlock/achievement/streak sub-engines
- **Plan 3 (Instrument Module Conversion):** Convert guitar/piano to formal InstrumentModule interface with getSkillTree, getCurriculumMap, etc.
- **Plan 4 (Bass Module):** New instrument with timing-first curriculum
- **AI Engine:** Coaching layer (placeholder in architecture, not implemented here)
- **CurriculumEngine expansion:** The existing `js/curriculum/curriculum_engine.js` has lesson sequencing logic; a future task will wire it into SparkSession.buildSession for guided sessions
