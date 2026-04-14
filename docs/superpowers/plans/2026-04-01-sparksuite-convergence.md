# SparkSuite Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the piano shim layer and unify piano + guitar into one instrument-generic architecture with a single `act()` dispatcher, shared pages driven by `getData()`/`ui` bags, and no context swap.

**Architecture:** Each instrument registers `getData()` (common-shape data bag), `ui` (rendering functions bag), and `act()` (instrument-specific action handler returning `true` when handled). Shared pages and shared `act()` call through `SparkInstruments.getActive()` instead of hardcoded globals. Piano shim files deleted after everything routes through the new system.

**Tech Stack:** Vanilla JavaScript, SparkInstruments registry (js/launcher.js)

**Spec:** `docs/superpowers/specs/2026-04-01-sparksuite-convergence-design.md`

---

### Task 1: Normalize Guitar `getData()` to Common Shape

**Files:**
- Modify: `js/instruments/guitar/register.js`
- Reference: `js/data.js` (globals: CHORDS, ALL_CHORDS, SONGS, GUITAR_SESSIONS, LC, LN, CHORD_NOTES, GUITAR_STRINGS, STRUM_PATTERNS, FINGER_EXERCISES)

- [ ] **Step 1: Expand guitar `getData()` to return the full common shape**

In `js/instruments/guitar/register.js`, replace the current `getData()` (lines 11-17):

```javascript
getData: function() {
  return {
    CHORDS: typeof CHORDS !== "undefined" ? CHORDS : {},
    ALL_CHORDS: typeof ALL_CHORDS !== "undefined" ? ALL_CHORDS : [],
    SESSIONS: typeof GUITAR_SESSIONS !== "undefined" ? GUITAR_SESSIONS : [],
    SONGS: typeof SONGS !== "undefined" ? SONGS : [],
    LC: typeof LC !== "undefined" ? LC : {},
    LN: typeof LN !== "undefined" ? LN : {},
    CHORD_NOTES: typeof CHORD_NOTES !== "undefined" ? CHORD_NOTES : {},
    STRINGS: typeof GUITAR_STRINGS !== "undefined" ? GUITAR_STRINGS : [],
    STRUM_PATTERNS: typeof STRUM_PATTERNS !== "undefined" ? STRUM_PATTERNS : [],
    FINGER_EXERCISES: typeof FINGER_EXERCISES !== "undefined" ? FINGER_EXERCISES : []
  };
},
```

- [ ] **Step 2: Verify guitar still launches and practice tab loads**

Open `index.html` in browser, select Guitar from launcher, navigate practice tab. Chords should render.

- [ ] **Step 3: Commit**

```bash
git add js/instruments/guitar/register.js
git commit -m "feat(guitar): normalize getData() to common instrument shape"
```

---

### Task 2: Normalize Piano `getData()` to Common Shape

**Files:**
- Modify: `js/instruments/piano/register.js`
- Reference: `js/instruments/piano/data.js` (PIANO_DATA IIFE containing CHORDS, SESSIONS, SONGS, LC, LN, CURRICULUM, etc.)

- [ ] **Step 1: Read piano data.js to identify the exact PIANO_DATA property names**

Check what properties PIANO_DATA exposes. The context swap in `pages.js` lines 15-18 lists: `CHORDS, SONGS, LC, LN, CHORD_COLORS, CHORD_NOTES, CURRICULUM, LH_PATTERNS, SESSION_PLANS, BADGES, SCALES, FINGER_EXERCISES, FINGER_BADGES, INJURY_TIPS, DAILY_TYPES, PLAY_STYLES, TRANSITION_TIPS, REWARD_PHASES`.

- [ ] **Step 2: Expand piano `getData()` to return common shape + extras**

In `js/instruments/piano/register.js`, replace the current `getData()` (lines 11-21):

```javascript
getData: function() {
  var d = typeof PIANO_DATA !== "undefined" ? PIANO_DATA : {};
  return {
    CHORDS: d.CHORDS || {},
    ALL_CHORDS: d.ALL_CHORDS || [],
    SESSIONS: typeof PIANO_SESSIONS !== "undefined" ? PIANO_SESSIONS : (d.SESSION_PLANS || []),
    SONGS: d.SONGS || (typeof PIANO_SONGS !== "undefined" ? PIANO_SONGS : []),
    LC: d.LC || {},
    LN: d.LN || {},
    CHORD_NOTES: d.CHORD_NOTES || {},
    CHORD_COLORS: d.CHORD_COLORS || {},
    STRINGS: [],
    STRUM_PATTERNS: [],
    FINGER_EXERCISES: d.FINGER_EXERCISES || [],
    // Piano extras
    CURRICULUM: d.CURRICULUM || (typeof PIANO_CURRICULUM !== "undefined" ? PIANO_CURRICULUM : []),
    LH_PATTERNS: d.LH_PATTERNS || [],
    BADGES: d.BADGES || [],
    SCALES: d.SCALES || [],
    FINGER_BADGES: d.FINGER_BADGES || [],
    DAILY_TYPES: d.DAILY_TYPES || [],
    PLAY_STYLES: d.PLAY_STYLES || [],
    TRANSITION_TIPS: d.TRANSITION_TIPS || [],
    REWARD_PHASES: d.REWARD_PHASES || [],
    VOICINGS: typeof PIANO_VOICINGS !== "undefined" ? PIANO_VOICINGS : {},
    CHORDS_FULL: typeof PIANO_CHORDS_FULL !== "undefined" ? PIANO_CHORDS_FULL : {},
    data: d
  };
},
```

- [ ] **Step 3: Verify piano still launches from the launcher**

Open browser, select Piano, check practice tab loads.

- [ ] **Step 4: Commit**

```bash
git add js/instruments/piano/register.js
git commit -m "feat(piano): normalize getData() to common instrument shape"
```

---

### Task 3: Add `ui` Bags to Both Instrument Registrations

**Files:**
- Modify: `js/instruments/guitar/register.js`
- Modify: `js/instruments/piano/register.js`
- Reference: `js/ui.js` (chordSVG, ringHTML, strumHTML, headerHTML, tabNavHTML, scaleSVG, strumHandSVG)
- Reference: `js/instruments/piano/ui.js` (pianoSVG, piano header/tabNav renderers)

- [ ] **Step 1: Add `ui` bag to guitar registration**

In `js/instruments/guitar/register.js`, add after `getData`:

```javascript
ui: {
  chord: function(chordObj, size, label, animate) {
    return typeof chordSVG === "function" ? chordSVG(chordObj, size, label, animate) : "";
  },
  header: function() {
    return typeof headerHTML === "function" ? headerHTML() : "";
  },
  tabNav: function() {
    return typeof tabNavHTML === "function" ? tabNavHTML() : "";
  },
  ring: function(pct, size, color) {
    return typeof ringHTML === "function" ? ringHTML(pct, size, color) : "";
  },
  strum: function(pattern) {
    return typeof strumHTML === "function" ? strumHTML(pattern) : "";
  },
  scale: function(scale, opts) {
    return typeof scaleSVG === "function" ? scaleSVG(scale, opts) : "";
  }
},
```

- [ ] **Step 2: Add `ui` bag to piano registration**

In `js/instruments/piano/register.js`, add after `getData`:

```javascript
ui: {
  chord: function(chordObj, size, label, animate) {
    return typeof pianoSVG === "function" ? pianoSVG(chordObj, { width: size, animate: animate }) : "";
  },
  header: function() {
    var ns = window._PianoPageNS && window._PianoPageNS.piano ? window._PianoPageNS.piano : {};
    return ns.headerHTML ? ns.headerHTML() : (typeof headerHTML === "function" ? headerHTML() : "");
  },
  tabNav: function() {
    var ns = window._PianoPageNS && window._PianoPageNS.piano ? window._PianoPageNS.piano : {};
    return ns.tabNavHTML ? ns.tabNavHTML() : (typeof tabNavHTML === "function" ? tabNavHTML() : "");
  },
  ring: function(pct, size, color) {
    return typeof ringHTML === "function" ? ringHTML(pct, size, color) : "";
  }
},
```

Note: Piano `ui.header` and `ui.tabNav` reference `_PianoPageNS` temporarily. These will be cleaned up when we delete `pages.js` in Task 8 — the functions will move to `ui.js` exports directly.

- [ ] **Step 3: Verify both instruments render from launcher**

Open browser, test Guitar launch, test Piano launch. Both should display correctly.

- [ ] **Step 4: Commit**

```bash
git add js/instruments/guitar/register.js js/instruments/piano/register.js
git commit -m "feat: add ui bags to guitar and piano instrument registrations"
```

---

### Task 4: Create Guitar `act()` Handler — Extract from Shared `app.js`

**Files:**
- Create: `js/instruments/guitar/app.js`
- Modify: `js/instruments/guitar/register.js` (wire up act handler)
- Reference: `js/app.js:321-775` (guitar-specific actions to extract)

This is the largest task. All guitar-specific actions move from shared `app.js` into guitar's own `act()` handler. The handler uses `getData()` instead of bare globals.

- [ ] **Step 1: Create `js/instruments/guitar/app.js`**

```javascript
// js/instruments/guitar/app.js — Guitar instrument action handler
(function() {

  function guitarAct(a, v) {
    var D = SparkInstruments.getActive().getData();

    // === Session Actions ===
    if (a === "quickStart") {
      var avail = D.CHORDS[S.level] || D.CHORDS[1];
      var ch = avail[Math.floor(Math.random() * avail.length)];
      S.sessionMicros = []; S.lastChordName = ch.name;
      snd("start"); S.currentChord = ch; S.timer = 120; S.timerActive = true; S.selectedVoicing = 0;
      S.screen = SCR.SESSION; render(); clearTimeout(T.session); T.session = setTimeout(tickS, 1000); saveState();
      return true;
    }
    if (a === "resumeSession") {
      var ch = null;
      for (var i = 0; i < D.ALL_CHORDS.length; i++) if (D.ALL_CHORDS[i].name === S.lastChordName) ch = D.ALL_CHORDS[i];
      if (!ch) { act("quickStart"); return true; }
      S.sessionMicros = [];
      snd("start"); S.currentChord = ch; S.timer = 120; S.timerActive = true; S.selectedVoicing = 0;
      if (typeof _prevChordKey !== "undefined") _prevChordKey = ch.name;
      S.screen = SCR.SESSION; render(); clearTimeout(T.session); T.session = setTimeout(tickS, 1000);
      return true;
    }
    if (a === "startSession") {
      var ch;
      for (var i = 0; i < D.ALL_CHORDS.length; i++) if (D.ALL_CHORDS[i].name === v) ch = D.ALL_CHORDS[i];
      if (ch) {
        S.sessionMicros = []; S.lastChordName = ch.name; snd("start"); S.currentChord = ch; S.timer = 120;
        S.timerActive = true; S.selectedVoicing = 0;
        if (typeof _prevChordKey !== "undefined") _prevChordKey = ch.name;
        S.screen = SCR.SESSION; render(); clearTimeout(T.session); T.session = setTimeout(tickS, 1000); saveState();
      }
      return true;
    }

    // === Drill Actions ===
    if (a === "startDrill") {
      var av = D.CHORDS[S.level] || D.CHORDS[1];
      var c1 = av[Math.floor(Math.random() * av.length)], c2 = c1, n = 0;
      while (c2.name === c1.name && av.length > 1 && n < 20) { c2 = av[Math.floor(Math.random() * av.length)]; n++; }
      S.drillChords = [c1, c2]; S.drillIdx = 0; S.drillTimer = 60; S.drillSwitches = 0; S.drillLastSwitchTime = Date.now();
      S.drillAdaptiveBpm = 60; S.drillConsecutiveFast = 0; S.drillConsecutiveSlow = 0;
      if (typeof _prevChordKey !== "undefined") _prevChordKey = c1.name;
      snd("start"); S.screen = SCR.DRILL; render(); T.drill = setTimeout(tickD, 1000);
      return true;
    }
    if (a === "drillSwitch") {
      snd("click");
      var now = Date.now();
      var fromChord = S.drillChords[S.drillIdx].name;
      var toChord = S.drillChords[(S.drillIdx + 1) % 2].name;
      var elapsed = (now - S.drillLastSwitchTime) / 1000;
      S.drillLastSwitchTime = now;
      if (elapsed < 15) {
        var key = fromChord + "->" + toChord;
        if (!S.transitionStats[key]) S.transitionStats[key] = { attempts: 0, avgTime: 0, best: 999 };
        var ts = S.transitionStats[key];
        ts.avgTime = (ts.avgTime * ts.attempts + elapsed) / (ts.attempts + 1);
        ts.attempts++;
        if (elapsed < ts.best) ts.best = elapsed;
        var targetSecs = 60 / S.drillAdaptiveBpm;
        if (elapsed < targetSecs * 0.8) {
          S.drillConsecutiveFast++; S.drillConsecutiveSlow = 0;
          if (S.drillConsecutiveFast >= 3) {
            S.drillAdaptiveBpm = Math.min(S.drillAdaptiveBpm + 3, 160);
            S.drillConsecutiveFast = 0;
            fireMicro("speed_up", "Speeding up!", "&#9654;&#65039;");
          }
        } else if (elapsed > targetSecs * 1.5) {
          S.drillConsecutiveSlow++; S.drillConsecutiveFast = 0;
          if (S.drillConsecutiveSlow >= 2) {
            S.drillAdaptiveBpm = Math.max(S.drillAdaptiveBpm - 5, 40);
            S.drillConsecutiveSlow = 0;
          }
        } else { S.drillConsecutiveFast = 0; S.drillConsecutiveSlow = 0; }
      }
      if (typeof _prevChordKey !== "undefined") _prevChordKey = fromChord;
      S.drillIdx = (S.drillIdx + 1) % 2; S.drillSwitches++;
      if (S.drillSwitches === 1) fireMicro("clean_switch", "Smooth switch!", "&#9889;");
      if (S.drillSwitches === 3) fireMicro("three_switches", "On fire!", "&#128293;");
      render();
      return true;
    }
    if (a === "drillTransition") {
      var parts = v.split("|");
      var c1 = null, c2 = null;
      for (var i = 0; i < D.ALL_CHORDS.length; i++) {
        if (D.ALL_CHORDS[i].name === parts[0]) c1 = D.ALL_CHORDS[i];
        if (D.ALL_CHORDS[i].name === parts[1]) c2 = D.ALL_CHORDS[i];
      }
      if (c1 && c2) {
        S.drillChords = [c1, c2]; S.drillIdx = 0; S.drillTimer = 60; S.drillSwitches = 0; S.drillLastSwitchTime = Date.now();
        S.drillAdaptiveBpm = 60; S.drillConsecutiveFast = 0; S.drillConsecutiveSlow = 0;
        if (typeof _prevChordKey !== "undefined") _prevChordKey = c1.name;
        snd("start"); S.screen = SCR.DRILL; render(); T.drill = setTimeout(tickD, 1000);
      }
      return true;
    }
    if (a === "drillCustomSet") {
      var idx = parseInt(v);
      if (idx >= 0 && idx < S.customSets.length) {
        var cs = S.customSets[idx];
        var pool = [];
        for (var i = 0; i < cs.chords.length; i++) {
          for (var j = 0; j < D.ALL_CHORDS.length; j++) {
            if (D.ALL_CHORDS[j].name === cs.chords[i]) { pool.push(D.ALL_CHORDS[j]); break; }
          }
        }
        if (pool.length < 2) return true;
        var c1 = pool[Math.floor(Math.random() * pool.length)], c2 = c1, n = 0;
        while (c2.name === c1.name && pool.length > 1 && n < 20) { c2 = pool[Math.floor(Math.random() * pool.length)]; n++; }
        S.drillChords = [c1, c2]; S.drillIdx = 0; S.drillTimer = 60; S.drillSwitches = 0; S.drillLastSwitchTime = Date.now();
        S.drillAdaptiveBpm = 60; S.drillConsecutiveFast = 0; S.drillConsecutiveSlow = 0;
        if (typeof _prevChordKey !== "undefined") _prevChordKey = c1.name;
        snd("start"); S.screen = SCR.DRILL; render(); T.drill = setTimeout(tickD, 1000);
      }
      return true;
    }

    // === Quiz Actions ===
    if (a === "startQuiz") {
      S.quizScore = 0; S.quizTotal = 0; S.quizStreak = 0; genQ(); S.screen = SCR.QUIZ;
      return true;
    }
    if (a === "answerQuiz" && S.quizAns === null) {
      var ch;
      for (var i = 0; i < D.ALL_CHORDS.length; i++) if (D.ALL_CHORDS[i].name === v) ch = D.ALL_CHORDS[i];
      if (ch) {
        var ok = ch.name === S.quizQ.name; S.quizAns = ch.name;
        if (ok) {
          snd("correct"); S.quizCorrect++; S.quizScore++; S.quizStreak++; S.xp += 10;
          logHistory("quiz", S.quizQ.name, 10);
          _sparkEmit("drill_answered", { appId: "chordspark", skillId: S.quizQ.name, correct: true, xp: 10 });
          checkBadges(); saveState();
          if (S.quizStreak === 3) fireMicro("quiz_streak", "Hat trick!", "&#127913;");
        } else { snd("wrong"); S.quizStreak = 0; }
        S.quizTotal++; render(); setTimeout(genQ, 1200);
      }
      return true;
    }

    // === Ear Training ===
    if (a === "startEarTrain") {
      var av = [];
      for (var _l = 1; _l <= S.level; _l++) av = av.concat(D.CHORDS[_l] || []);
      if (!av.length) av = D.CHORDS[1];
      var q = av[Math.floor(Math.random() * av.length)];
      var opts = [q.name];
      var attempts = 0;
      while (opts.length < 4 && attempts < 100) {
        var r = D.ALL_CHORDS[Math.floor(Math.random() * D.ALL_CHORDS.length)];
        if (opts.indexOf(r.name) === -1) opts.push(r.name);
        attempts++;
      }
      opts = shuffle(opts);
      S.earTrainQ = q.name; S.earTrainOpts = opts; S.earTrainAns = null;
      S.earTrainScore = S.earTrainScore || 0; S.earTrainTotal = S.earTrainTotal || 0; S.earTrainStreak = S.earTrainStreak || 0;
      strumChord(q.name); render();
      return true;
    }

    // === Songs ===
    if (a === "openSong") {
      var sg = typeof v === "number" ? D.SONGS[v] : null;
      if (!sg) { for (var i = 0; i < D.SONGS.length; i++) if (D.SONGS[i].title === v) { sg = D.SONGS[i]; break; } }
      if (sg && sg.level <= S.level) {
        S.selectedSong = sg; S.songPlaying = false; S.songBeat = 0; clearInterval(T.song);
        S.screen = SCR.SONG; render();
      }
      return true;
    }

    // === Guided Sessions ===
    if (a === "guidedStart") {
      var plan = D.SESSIONS[S.guidedSession - 1];
      if (!plan) { S.guidedSession = 1; plan = D.SESSIONS[0]; }
      S.guidedPlan = plan; S.guidedStep = "spark"; S.newMovePhase = null; S.guidedPaused = false;
      S.screen = SCR.GUIDED; snd("start"); render();
      return true;
    }
    if (a === "guidedComplete") {
      if (S.metronomeOn) stopMetronome();
      var plan = S.guidedPlan;
      if (plan) {
        if (!Array.isArray(S.completedGuidedSessions)) S.completedGuidedSessions = [];
        if (S.completedGuidedSessions.indexOf(plan.num) < 0) S.completedGuidedSessions.push(plan.num);
        S.xp += 30; S.sessions++;
        var today = new Date().toISOString().split("T")[0];
        if (S.lastSessionDate !== today) { S.streak++; S.lastSessionDate = today; }
        if (plan.newMove && plan.newMove.chord) {
          var k = plan.newMove.chord;
          S.chordProgress[k] = Math.min((S.chordProgress[k] || 0) + 25, 100);
        }
        S.guidedSession = Math.min(D.SESSIONS.length, plan.num + 1);
        logHistory("guided", "Session " + plan.num + ": " + plan.title, 30);
        _sparkEmit("lesson_completed", { appId: "chordspark", lessonId: "guided_" + plan.num, xp: 30 });
        checkBadges();
      }
      S.xpToast = { amount: 30, time: Date.now() };
      saveState(); trigC(); S.screen = SCR.GUIDED_DONE; render();
      return true;
    }

    // === Finger Exercises ===
    if (a === "startFingerEx") {
      var ex = null;
      for (var fi = 0; fi < D.FINGER_EXERCISES.length; fi++) if (D.FINGER_EXERCISES[fi].id === v) { ex = D.FINGER_EXERCISES[fi]; break; }
      if (!ex) return true;
      S.fingerExId = v; S.fingerExTimer = ex.duration; S.fingerExActive = true; S.fingerExCount = 0;
      snd("start");
      clearInterval(T.fingerEx);
      T.fingerEx = setInterval(function() {
        if (!S.fingerExActive) return;
        S.fingerExTimer--;
        addPracticeSecond();
        if (S.fingerExTimer <= 0) {
          clearInterval(T.fingerEx); S.fingerExActive = false;
          snd("complete"); S.xp += 10;
          if (typeof SparkState.read(["fingerStats"], null) !== "object" || SparkState.read(["fingerStats"], null) === null) SparkState.write(["fingerStats"], {});
          SparkState.write(["fingerStats", v], (SparkState.read(["fingerStats", v], 0) || 0) + 1);
          SparkState.write(["xpToast"], { amount: 10, time: Date.now() });
          saveState();
        }
        render();
      }, 1000);
      render();
      return true;
    }
    if (a === "stopFingerEx") {
      clearInterval(T.fingerEx); S.fingerExActive = false; S.fingerExId = null; render();
      return true;
    }

    // Not handled by guitar
    return false;
  }

  window.guitarAct = guitarAct;
})();
```

- [ ] **Step 2: Wire guitarAct into guitar registration**

In `js/instruments/guitar/register.js`, add after the `ui` property:

```javascript
act: function(a, v) {
  return guitarAct(a, v);
},
```

- [ ] **Step 3: Add `<script src="js/instruments/guitar/app.js"></script>` to `index.html`**

Add it after `guitar/register.js` and before the shared `app.js`.

- [ ] **Step 4: Verify guitar still works with both old and new act paths**

At this point both the old inline actions AND the new `guitarAct` exist. The old code still runs (shared act doesn't delegate yet). Test that guitar loads without errors.

- [ ] **Step 5: Commit**

```bash
git add js/instruments/guitar/app.js js/instruments/guitar/register.js index.html
git commit -m "feat(guitar): create guitar act() handler with actions from shared app.js"
```

---

### Task 5: Wire Piano `act()` Handler into Registration

**Files:**
- Modify: `js/instruments/piano/app.js` (expose act function, make it return true/false)
- Modify: `js/instruments/piano/register.js` (wire up act handler)

Piano already has `pianoAct()` as a global. We need to:
1. Make it return `true` for handled actions (currently returns nothing)
2. Register it on the instrument

- [ ] **Step 1: Modify piano `app.js` to return true from act**

At the end of the piano `app.js` IIFE (around line 1760), find where it exposes `pianoAct`:

```javascript
window.pianoAct = act;
```

The internal `act()` uses a `switch` statement. After the switch, add a return pattern. Wrap the switch in a handled-tracking variable:

At the top of the piano `act()` function (line 573), add:
```javascript
function act(action, param) {
  var _handled = true;
  switch (action) {
```

Change the `default` case (or add one at the end of the switch):
```javascript
    default:
      _handled = false;
      break;
  }
  if (_handled) render();
  return _handled;
}
```

Note: Many cases already call `render()` and `break`. The `if (_handled) render()` at the end is a safety net — cases that already call render() before break will double-render harmlessly (the DOM is just re-set). Review each case to ensure the existing `break` statements are preserved.

- [ ] **Step 2: Add act to piano registration**

In `js/instruments/piano/register.js`, add after `ui`:

```javascript
act: function(a, v) {
  return typeof pianoAct === "function" ? pianoAct(a, v) : false;
},
```

- [ ] **Step 3: Verify piano still launches and actions work**

Test piano launch, practice tab, starting a session, drill, changing tabs.

- [ ] **Step 4: Commit**

```bash
git add js/instruments/piano/app.js js/instruments/piano/register.js
git commit -m "feat(piano): wire pianoAct into instrument registration with return value"
```

---

### Task 6: Rewrite Shared `act()` as Thin Router

**Files:**
- Modify: `js/app.js:321-775` (replace guitar-specific actions with instrument delegation)

- [ ] **Step 1: Replace the instrument delegation block and remove extracted guitar actions**

In `js/app.js`, replace lines 321-328 (the piano context-swap delegation):

```javascript
window.act = function(a, v) {
  // Delegate to active instrument's handler first
  var _inst = SparkInstruments.getActive();
  if (_inst && _inst.act && _inst.act(a, v)) return;

  // === Shared actions (instrument-agnostic) ===
```

Then remove the following guitar-specific action blocks that were extracted to `guitar/app.js`:
- `quickStart` (lines ~337-342)
- `resumeSession` (lines ~344-349)
- `startSession` (lines ~351-354)
- `startDrill` (lines ~365-373)
- `drillSwitch` (lines ~374-409)
- `drillTransition` (lines ~411-424)
- `startQuiz` (line ~436)
- `answerQuiz` (lines ~437-445)
- `startEarTrain` (lines ~447-461)
- `openSong` (lines ~496-499)
- `guidedStart` (lines ~638-643)
- `guidedComplete` (lines ~660-679)
- `startFingerEx` (lines ~611-633)
- `stopFingerEx` (lines ~634-636)
- `drillCustomSet` (lines ~733-751)

Keep all shared actions: `tab`, `selLevel`, `toggleTimer`, `doneSession`, `replayEarTrain`, `answerEarTrain`, `previewChord`, `selectVoicing`, `openStrum`, `toggleStrum`, `songsSubTab`, `toggleSong`, `completeSong`, `startTuner`, `stopTuner`, `toggleMetro`, `metroBpm`, `toggleChordDetect`, `toggleDark`, `setIntention`, `completeOnboarding`, `songSort`, `songFilter`, `stemSolo`, `stemAll`, navigation actions (`openRecommendations`, `openCareer`, etc.), `guidedNext`, `guidedAdvancePhase`, `guidedStop`, `dualChord`, `toggleAnchor`, `dualPreview`, `setGoal`, custom set CRUD (`newSet`, `setName`, `toggleSetChord`, `saveSet`, `cancelSet`, `editSet`, `deleteSet`), `rhythmBpm`, `startRhythm`, `rhythmTap`, `setTheme`.

- [ ] **Step 2: Verify guitar works end-to-end through the new routing**

Test: launch guitar → quickStart → drill → quiz → ear training → guided session. All should route through `guitarAct()` now.

- [ ] **Step 3: Verify piano works end-to-end through the new routing**

Test: launch piano → practice tab → start session → drill → songs. All should route through `pianoAct()` now. No context swap involved.

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "feat: rewrite shared act() as thin router with instrument delegation"
```

---

### Task 7: Make Shared Pages Instrument-Generic

**Files:**
- Modify: `js/pages/practice.js` (replace CHORDS, GUITAR_SESSIONS, LC, LN, chordSVG)
- Modify: `js/pages/session.js` (replace ALL_CHORDS, LC, chordSVG)
- Modify: `js/pages/songs.js` (replace SONGS, ALL_CHORDS, LC)
- Modify: `js/pages/games.js` (replace ALL_CHORDS, CHORDS, chordSVG)
- Modify: `js/pages/tools.js` (replace GUITAR_STRINGS, ALL_CHORDS, chordSVG, CHORDS)
- Modify: `js/pages/guided.js` (replace ALL_CHORDS, chordSVG)
- Modify: `js/pages/shared.js` (replace GUITAR_STRINGS)
- Modify: `js/pages/dual.js` (replace ALL_CHORDS, GUITAR_ANCHOR, chordSVG)

- [ ] **Step 1: Add data/UI bag acquisition pattern to each page file**

At the top of each page renderer function, add:
```javascript
var D = SparkInstruments.getActive() ? SparkInstruments.getActive().getData() : {};
var UI = SparkInstruments.getActive() ? SparkInstruments.getActive().ui : {};
```

- [ ] **Step 2: Replace hardcoded references in `practice.js`**

| Line | Before | After |
|------|--------|-------|
| 49 | `GUITAR_SESSIONS[S.guidedSession-1]` | `D.SESSIONS[S.guidedSession-1]` |
| 55 | `GUITAR_SESSIONS.length` | `D.SESSIONS.length` |
| 105 | `LC[l]` | `D.LC[l]` |
| 105 | `LN[l]` | `D.LN[l]` |
| 108 | `LC[S.selectedLevel]` | `D.LC[S.selectedLevel]` |
| 108 | `LN[S.selectedLevel]` | `D.LN[S.selectedLevel]` |
| 112 | `CHORDS[S.selectedLevel]` | `D.CHORDS[S.selectedLevel]` |
| 117 | `chordSVG(c,90)` | `UI.chord(c,90)` |
| 118 | `LC[S.selectedLevel]` | `D.LC[S.selectedLevel]` |
| 163 | `CHORDS[l]` | `D.CHORDS[l]` |

- [ ] **Step 3: Replace hardcoded references in `session.js`**

| Line | Before | After |
|------|--------|-------|
| 30 | `chordSVG(displayChord,220,c.name,shouldAnimate)` | `UI.chord(displayChord,220,c.name,shouldAnimate)` |
| 77 | `LC[S.level]` (2 occurrences) | `D.LC[S.level]` |
| 78 | `chordSVG(c,180,null,drillChanged)` | `UI.chord(c,180,null,drillChanged)` |
| 114 | `chordSVG(c,100)` | `UI.chord(c,100)` |
| 165 | `ALL_CHORDS` (loop) | `D.ALL_CHORDS` |
| 166 | `chordSVG(ch,160)` | `UI.chord(ch,160)` |

- [ ] **Step 4: Replace hardcoded references in `songs.js`**

| Line | Before | After |
|------|--------|-------|
| 16 | `LC[sp.level]` | `D.LC[sp.level]` |
| 72 | `SONGS.slice()` | `D.SONGS.slice()` |
| 116 | `SONGS.indexOf(s)` | `D.SONGS.indexOf(s)` |
| 172-173 | `ALL_CHORDS` (loop) | `D.ALL_CHORDS` |
| 215 | `ALL_CHORDS` (loop) | `D.ALL_CHORDS` |

- [ ] **Step 5: Replace hardcoded references in `games.js`**

| Line | Before | After |
|------|--------|-------|
| 84 | `chordSVG(S.runnerTarget,55)` | `UI.chord(S.runnerTarget,55)` |
| 149 | `ALL_CHORDS` (loop) | `D.ALL_CHORDS` |
| 166 | `CHORDS[l]` | `D.CHORDS[l]` |
| 187-189 | `ALL_CHORDS` (loop) | `D.ALL_CHORDS` |
| 213 | `ALL_CHORDS` (loop) | `D.ALL_CHORDS` |
| 215 | `chordSVG(ch,160)` | `UI.chord(ch,160)` |

- [ ] **Step 6: Replace hardcoded references in `tools.js`**

| Line | Before | After |
|------|--------|-------|
| 7 | `GUITAR_STRINGS.length` | `D.STRINGS.length` |
| 8 | `GUITAR_STRINGS[i]` | `D.STRINGS[i]` |
| 89 | `ALL_CHORDS` (loop) | `D.ALL_CHORDS` |
| 231 | `chordSVG(CHORDS[1][0],200)` | `UI.chord(D.CHORDS[1][0],200)` |

- [ ] **Step 7: Replace hardcoded references in `guided.js`**

| Line | Before | After |
|------|--------|-------|
| 101, 122, 202 | `ALL_CHORDS` (loops) | `D.ALL_CHORDS` |
| 104, 131, 142, 149, 163, 205 | `chordSVG(...)` | `UI.chord(...)` |

- [ ] **Step 8: Replace hardcoded references in `shared.js`**

| Line | Before | After |
|------|--------|-------|
| 75-76 | `GUITAR_STRINGS` | `D.STRINGS` |

- [ ] **Step 9: Replace hardcoded references in `dual.js`**

| Line | Before | After |
|------|--------|-------|
| 79 | `chordSVG(chord,sz,...)` | `UI.chord(chord,sz,...)` |
| 83, 89, 90, 177, 181 | `GUITAR_ANCHOR` | Keep as-is — this is guitar-specific dual-instrument display |
| 104-105 | `ALL_CHORDS` (loop) | `D.ALL_CHORDS` |

Note: `GUITAR_ANCHOR` in `dual.js` is intentionally guitar-specific (it's about anchor finger technique). This page can stay referencing the global — it's only shown when guitar is active.

- [ ] **Step 10: Verify both instruments work with genericized pages**

Test guitar: practice tab (chord grid, level selector, guided session card), session page, drill, quiz, songs, games, tools (tuner with strings).
Test piano: practice tab, session, songs. Piano pages should now render via `UI.chord()` → `pianoSVG()` instead of `chordSVG()`.

- [ ] **Step 11: Commit**

```bash
git add js/pages/practice.js js/pages/session.js js/pages/songs.js js/pages/games.js js/pages/tools.js js/pages/guided.js js/pages/shared.js js/pages/dual.js
git commit -m "feat: make shared pages instrument-generic via getData() and ui bags"
```

---

### Task 8: Merge Piano State into Shared State

**Files:**
- Modify: `js/state.js:292-322` (add piano persistence fields)
- Modify: `js/instruments/piano/register.js:32-63` (init already handles defaults — verify completeness)
- Delete: `js/instruments/piano/state.js`

- [ ] **Step 1: Read piano state.js PERSIST array and identify fields not in shared PERSIST_FIELDS**

Piano's `state.js` lines 4-69 has a PERSIST array. Compare against shared `state.js` lines 292-322. Add any missing piano-specific fields.

- [ ] **Step 2: Add missing piano fields to shared PERSIST_FIELDS**

In `js/state.js`, add piano-specific persistence fields to the PERSIST_FIELDS array:

```javascript
// Piano-specific persistence
"currentSession","lhLevel","keyboardSize","stylePrefs","focusMode",
"dailyGoal","dailyPracticed","a4Tuning","chord","active","paused",
"lastPractice","personalBests","earned","transitionStats",
"drillChord","drillTimer","onboardingComplete","onboardingStep",
"_inPlacement","sessionPlan","practiceLen",
```

- [ ] **Step 3: Verify piano init() in register.js covers all default values**

Piano's `register.js` init() (lines 39-63) already sets defaults for most fields. Verify all persist fields have defaults.

- [ ] **Step 4: Remove `<script>` tag for `piano/state.js` from `index.html`**

- [ ] **Step 5: Delete `js/instruments/piano/state.js`**

- [ ] **Step 6: Verify piano state persists across page reloads**

Launch piano, change some settings, reload. State should persist.

- [ ] **Step 7: Commit**

```bash
git rm js/instruments/piano/state.js
git add js/state.js js/instruments/piano/register.js index.html
git commit -m "feat: merge piano persistence fields into shared state, delete piano/state.js"
```

---

### Task 9: Clean Up Piano UI — Move to `ui` Bag, Remove Window Globals

**Files:**
- Modify: `js/instruments/piano/ui.js` (wrap in IIFE, export via registration instead of globals)
- Modify: `js/instruments/piano/register.js` (update ui bag to reference functions directly)

- [ ] **Step 1: Ensure piano ui.js functions are accessible to the registration's `ui` bag**

The piano `ui.js` currently exposes `pianoSVG` as a global. Keep it as a global for now — the `ui.chord` wrapper in `register.js` already references it via `typeof pianoSVG === "function"`. The important thing is that shared pages call `UI.chord()` instead of `pianoSVG()` directly.

- [ ] **Step 2: Move piano header/tabNav from _PianoPageNS to ui.js exports**

Find where `_PianoPageNS.piano.headerHTML` and `_PianoPageNS.piano.tabNavHTML` are defined (likely in piano/ui.js or piano/app.js). Move them to be direct window globals like `pianoHeaderHTML` and `pianoTabNavHTML`.

Update piano registration's `ui` bag:
```javascript
header: function() {
  return typeof pianoHeaderHTML === "function" ? pianoHeaderHTML() : "";
},
tabNav: function() {
  return typeof pianoTabNavHTML === "function" ? pianoTabNavHTML() : "";
},
```

- [ ] **Step 3: Verify piano header and tab nav render correctly**

- [ ] **Step 4: Commit**

```bash
git add js/instruments/piano/ui.js js/instruments/piano/register.js
git commit -m "refactor(piano): move UI functions to direct exports for ui bag"
```

---

### Task 10: Delete Piano Shim Layer

**Files:**
- Delete: `js/instruments/piano/pages.js`
- Delete: `js/instruments/piano/helpers.js`
- Modify: `js/instruments/piano/app.js` (remove references to deleted helpers — inline or move to register.js)
- Modify: `index.html` (remove script tags for deleted files)

- [ ] **Step 1: Move essential helper functions from helpers.js into piano app.js or register.js**

Functions in `helpers.js` that piano `app.js` imports (lines 27-30):
- `getCurrentSessionPlan` → move into piano `app.js` IIFE
- `getCurrentLevel` → move into piano `app.js` IIFE
- `levelForSession` → move into piano `app.js` IIFE
- `addPracticeSecond` → already exists in shared code, remove piano duplicate

Other helpers (`addXP`, `addHistory`, `checkStreak`, `recordTransition`, `clickableDiv`, `ifThenCard`, `getChordMatch`, `fireMicro`, `checkPracticeDate`, `getRewardPhase`) — check if they're used in piano `app.js`. Those that are: inline into piano `app.js` IIFE. Those that aren't: drop them.

- [ ] **Step 2: Update piano app.js to use getData() instead of raw PIANO_DATA globals**

Piano `app.js` references `PIANO_SESSIONS`, `PIANO_CURRICULUM`, `PIANO_CHORDS_FULL` etc. directly. Replace with:
```javascript
var D = SparkInstruments.getActive().getData();
// then use D.SESSIONS, D.CURRICULUM, D.CHORDS_FULL etc.
```

This can be done at the top of the `act()` function (already partially shown in Task 5).

- [ ] **Step 3: Remove piano pages.js — delete file and script tag**

Delete `js/instruments/piano/pages.js`. This removes:
- `_enterPianoContext()` / `_exitPianoContext()`
- `_enterPianoCtx` / `_exitPianoCtx` window globals
- `_pianoPage()` wrapper
- `PIANO_PAGES` construction
- `_registerPianoPages()` function

- [ ] **Step 4: Update piano page registration to work without the context swap**

Piano's pages are currently registered via `_registerPianoPages()` which wraps each page in `_pianoPage()` (the context swap). Now that shared pages use `getData()` and `UI` bags, piano-only pages (stems, onboarding, perform, etc.) should be registered directly on the instrument without wrapping:

In `js/instruments/piano/register.js`, update the `pages` property to directly reference the page renderers:

```javascript
pages: (function() {
  var p = {};
  // Piano-only pages registered directly
  // These will be populated after piano ui.js loads
  return p;
})(),
```

Then in piano `app.js` or `ui.js`, after defining the page functions, register them:
```javascript
var inst = SparkInstruments.getAll().find(function(i) { return i.id === "pianospark"; });
if (inst) {
  inst.pages[SCR.SESSION] = sessionPage;
  inst.pages[SCR.PERFORM] = performPage;
  inst.pages[SCR.STEMS] = stemsPlayerPage;
  // ... other piano-only pages
}
```

- [ ] **Step 5: Remove helpers.js — delete file and script tag**

Delete `js/instruments/piano/helpers.js`.

- [ ] **Step 6: Remove `_registerPianoPages()` call from init/startup code**

Search for where `_registerPianoPages()` is called (likely in `app.js` or `index.html` inline script) and remove it.

- [ ] **Step 7: Clean up index.html script tags**

Remove:
```html
<script src="js/instruments/piano/state.js"></script>  <!-- already removed in Task 8 -->
<script src="js/instruments/piano/pages.js"></script>
<script src="js/instruments/piano/helpers.js"></script>
```

- [ ] **Step 8: Verify both instruments work end-to-end**

Full test pass:
- Guitar: launcher → practice → session → drill → quiz → ear training → songs → guided → tools → games
- Piano: launcher → practice → session → drill → songs → stems → perform → settings
- Switch between instruments via back-to-launcher

- [ ] **Step 9: Commit**

```bash
git rm js/instruments/piano/pages.js js/instruments/piano/helpers.js
git add js/instruments/piano/app.js js/instruments/piano/register.js index.html js/app.js
git commit -m "feat: delete piano shim layer — no context swap, no parallel dispatcher"
```

---

### Task 11: Final Cleanup and Verification

**Files:**
- Modify: `js/app.js` (remove any dead code referencing piano shim)
- All files (grep for remnants)

- [ ] **Step 1: Grep for dead references**

Search the entire `js/` directory for:
- `_enterPianoCtx` / `_exitPianoCtx`
- `_enterPianoContext` / `_exitPianoContext`
- `_pianoPage`
- `_PianoPageNS`
- `window._pctx`
- `pianoAct` (should only exist in piano/app.js and piano/register.js)
- `GUITAR_SESSIONS` (should only exist in data.js definition)
- Bare `CHORDS[` in pages (should be `D.CHORDS[`)
- Bare `ALL_CHORDS` in pages (should be `D.ALL_CHORDS`)

Remove any dead references found.

- [ ] **Step 2: Verify success criteria from spec**

- [ ] No `_enterPianoCtx`, `_exitPianoCtx`, `_pianoPage`, `_PianoPageNS`, or `window._pctx` anywhere
- [ ] No `if (activeInstrument === "pianospark")` in shared `act()`
- [ ] No bare `CHORDS[S.level]`, `ALL_CHORDS`, `GUITAR_SESSIONS` in shared pages
- [ ] Single `act()` entry point with instrument handler delegation
- [ ] Both instruments launch and function correctly

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove dead piano shim references, verify convergence complete"
```
