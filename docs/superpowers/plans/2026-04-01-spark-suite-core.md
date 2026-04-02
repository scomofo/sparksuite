# Spark Suite Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract shared progression/content/event logic into `js/spark-core/` and create `js/performance-core/` adapter seam, making ChordSpark the first reference implementation of the Spark Suite architecture.

**Architecture:** Two new module directories (`spark-core` for learning semantics, `performance-core` for renderer/transport contracts) sit between the existing core utilities (`js/core/`) and app code (`js/app.js`, pages). They use browser globals (no module bundler). ChordSpark's existing state/persistence is adapted incrementally via a bridge layer — no big-bang migration.

**Tech Stack:** Vanilla JS (browser globals), Node.js assert for tests, localStorage for persistence.

**Existing code to know about:**
- `js/core/persistence.js` — `buildPersistedStateSnapshot()`, `applyPersistedStateSnapshot()`, `safeJsonParse()`, `capArray()`
- `js/core/progression.js` — `calculateMasteryFromAccuracy()`, `updateSparkMastery()`
- `js/core/contracts.js` — shell factories for charts, events, results
- `js/core/performance/chart_contracts.js` — `createSparkChart()`, `createSparkEvent()`, `createSparkPhrase()`
- `js/state.js` — global `S` object, `PERSIST_FIELDS` array (~100 keys), `saveState()`/`loadState()`, `logHistory()`
- `js/spark-highway.js` — full SparkHighway canvas renderer with `GUITAR_SKIN`/`PIANO_SKIN` already matching SparkGame spec
- `js/performance/highway.js` — wrapper: `ensureSparkHighway()`, `feedChartToHighway()`, `updateSparkHighway()`
- `js/performance/transport.js` — `PerformanceTransport` with wall-clock + audio-source modes
- `tests/test_core.js` — Node.js assert-based, loads browser globals via `eval(loadJS(...))`
- `index.html` — loads ~200 scripts in order; `js/core/*` loads first, `js/app.js` loads last

---

## File Structure

### New files to create

**spark-core (Track A):**
- `js/spark-core/profile-schema.js` — suite profile creation, defaults, migration
- `js/spark-core/storage.js` — versioned localStorage wrapper for suite profile
- `js/spark-core/events.js` — event queue for suite-wide actions
- `js/spark-core/progress-engine.js` — pure functions: XP, streaks, lessons, drills, unlocks
- `js/spark-core/achievements.js` — suite-wide badge definitions and evaluation
- `js/spark-core/content-schema.js` — content validation helpers
- `js/spark-core/content-normalizer.js` — normalize ChordSpark/PianoSpark data into suite shape
- `js/spark-core/index.js` — barrel that makes all modules available as `SparkCore.*`

**performance-core (Track B):**
- `js/performance-core/chart-contract.js` — normalize charts into shared event shape
- `js/performance-core/transport-contract.js` — transport mode abstraction (wall-clock / audio-clock)
- `js/performance-core/spark-highway-adapter.js` — stable adapter for highway renderer
- `js/performance-core/performance-events.js` — structured performance event emission
- `js/performance-core/index.js` — barrel

**Schemas and docs:**
- `content/spark_content.schema.json`
- `content/spark_profile.schema.json`
- `content/examples/chordspark.sample.json`
- `content/examples/pianospark.sample.json`
- `docs/spark-highway-contract.md`

**Tests:**
- `tests/test_spark_core.js` — suite core tests
- `tests/test_performance_core.js` — performance contract tests

### Files to modify
- `index.html` — add script tags for new modules (after `js/core/*`, before `js/data.js`)
- `js/state.js` — add suite profile bridge (initialize from suite profile on load, sync back on save)
- `js/app.js` — emit spark events at existing XP/streak/lesson/session completion points

---

## Task 1: Suite Profile Schema and Storage

**Files:**
- Create: `js/spark-core/profile-schema.js`
- Create: `js/spark-core/storage.js`
- Test: `tests/test_spark_core.js`

- [ ] **Step 1: Create test file with profile creation tests**

```js
// tests/test_spark_core.js
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log('  PASS: ' + name); }
  catch (e) { failed++; console.error('  FAIL: ' + name + '\n    ' + e.message); }
}

// Minimal globals for eval
global.window = global;
global.localStorage = (function() {
  var store = {};
  return {
    getItem: function(k) { return store[k] || null; },
    setItem: function(k, v) { store[k] = String(v); },
    removeItem: function(k) { delete store[k]; },
    clear: function() { store = {}; }
  };
})();

function loadJS(file) {
  var code = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  return code;
}

eval(loadJS('js/spark-core/profile-schema.js'));
eval(loadJS('js/spark-core/storage.js'));

console.log('\n--- SparkCore: Profile Schema ---');

test('createEmptySuiteProfile returns valid shape', function() {
  var p = SparkProfile.createEmpty();
  assert.strictEqual(p.schemaVersion, 1);
  assert.strictEqual(p.suite, 'spark');
  assert.ok(p.apps);
  assert.ok(p.suiteRewards);
});

test('ensureAppProfile adds missing app', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  assert.ok(p.apps.chordspark);
  assert.strictEqual(p.apps.chordspark.instrument, 'guitar');
  assert.strictEqual(p.apps.chordspark.stats.xp, 0);
});

test('ensureAppProfile does not overwrite existing app', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  p.apps.chordspark.stats.xp = 500;
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  assert.strictEqual(p.apps.chordspark.stats.xp, 500);
});

test('migrateProfile upgrades missing fields', function() {
  var p = { schemaVersion: 1, suite: 'spark', apps: {} };
  SparkProfile.migrate(p);
  assert.ok(p.suiteRewards);
  assert.ok(p.suiteRewards.badges);
});

console.log('\n--- SparkCore: Storage ---');

test('saveSuiteProfile and loadSuiteProfile roundtrip', function() {
  localStorage.clear();
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  p.apps.chordspark.stats.xp = 42;
  SparkStorage.save(p);
  var loaded = SparkStorage.load();
  assert.strictEqual(loaded.apps.chordspark.stats.xp, 42);
});

test('loadSuiteProfile returns empty profile when nothing saved', function() {
  localStorage.clear();
  var loaded = SparkStorage.load();
  assert.strictEqual(loaded.schemaVersion, 1);
  assert.ok(loaded.apps);
});

// Summary will be at bottom of file after all test sections
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test_spark_core.js`
Expected: FAIL — `SparkProfile` is not defined

- [ ] **Step 3: Implement profile-schema.js**

```js
// js/spark-core/profile-schema.js
(function() {

  function createEmptyAppProfile(instrument) {
    return {
      instrument: instrument,
      stats: {
        xp: 0,
        level: 1,
        streakDays: 0,
        sessionsCompleted: 0,
        lessonsCompleted: 0
      },
      mastery: {},
      completedLessonIds: [],
      unlockedIds: [],
      settings: {},
      songAudioData: {}
    };
  }

  var SparkProfile = {
    CURRENT_VERSION: 1,

    createEmpty: function() {
      return {
        schemaVersion: this.CURRENT_VERSION,
        suite: "spark",
        userId: "local-user",
        apps: {},
        suiteRewards: {
          badges: [],
          cosmetics: [],
          challengeProgress: {}
        }
      };
    },

    ensureApp: function(profile, appId, instrument) {
      if (!profile.apps) profile.apps = {};
      if (!profile.apps[appId]) {
        profile.apps[appId] = createEmptyAppProfile(instrument);
      }
      return profile.apps[appId];
    },

    migrate: function(profile) {
      if (!profile.suiteRewards) {
        profile.suiteRewards = { badges: [], cosmetics: [], challengeProgress: {} };
      }
      if (!profile.apps) profile.apps = {};
      for (var appId in profile.apps) {
        var app = profile.apps[appId];
        if (!app.stats) app.stats = { xp: 0, level: 1, streakDays: 0, sessionsCompleted: 0, lessonsCompleted: 0 };
        if (!app.mastery) app.mastery = {};
        if (!app.completedLessonIds) app.completedLessonIds = [];
        if (!app.unlockedIds) app.unlockedIds = [];
        if (!app.settings) app.settings = {};
        if (!app.songAudioData) app.songAudioData = {};
      }
      profile.schemaVersion = this.CURRENT_VERSION;
      return profile;
    }
  };

  window.SparkProfile = SparkProfile;
})();
```

- [ ] **Step 4: Implement storage.js**

```js
// js/spark-core/storage.js
(function() {

  var STORAGE_KEY = "spark_suite_profile";

  var SparkStorage = {
    save: function(profile) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      } catch (e) {
        console.error("SparkStorage: save failed", e);
      }
    },

    load: function() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return SparkProfile.createEmpty();
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return SparkProfile.createEmpty();
        SparkProfile.migrate(parsed);
        return parsed;
      } catch (e) {
        console.error("SparkStorage: load failed", e);
        return SparkProfile.createEmpty();
      }
    },

    clear: function() {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    }
  };

  window.SparkStorage = SparkStorage;
})();
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node tests/test_spark_core.js`
Expected: All 6 tests PASS

- [ ] **Step 6: Commit**

```bash
git add js/spark-core/profile-schema.js js/spark-core/storage.js tests/test_spark_core.js
git commit -m "feat(core): add spark-core profile schema and storage"
```

---

## Task 2: Event Queue

**Files:**
- Create: `js/spark-core/events.js`
- Modify: `tests/test_spark_core.js`

- [ ] **Step 1: Add event queue tests to test_spark_core.js**

Append before the summary section:

```js
eval(loadJS('js/spark-core/events.js'));

console.log('\n--- SparkCore: Events ---');

test('emitSparkEvent adds to pending queue', function() {
  SparkEvents.clear();
  SparkEvents.emit('lesson_completed', { appId: 'chordspark', lessonId: 'test1' });
  var pending = SparkEvents.getPending();
  assert.strictEqual(pending.length, 1);
  assert.strictEqual(pending[0].type, 'lesson_completed');
  assert.strictEqual(pending[0].payload.lessonId, 'test1');
});

test('clearPendingSparkEvents empties queue', function() {
  SparkEvents.emit('test', {});
  SparkEvents.clear();
  assert.strictEqual(SparkEvents.getPending().length, 0);
});

test('events have timestamps', function() {
  SparkEvents.clear();
  SparkEvents.emit('streak_updated', { days: 3 });
  var evt = SparkEvents.getPending()[0];
  assert.ok(evt.timestamp > 0);
});

test('onSparkEvent listener fires', function() {
  var received = null;
  SparkEvents.on('xp_awarded', function(evt) { received = evt; });
  SparkEvents.emit('xp_awarded', { amount: 10 });
  assert.ok(received);
  assert.strictEqual(received.payload.amount, 10);
  SparkEvents.off('xp_awarded');
  SparkEvents.clear();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test_spark_core.js`
Expected: FAIL — `SparkEvents` is not defined

- [ ] **Step 3: Implement events.js**

```js
// js/spark-core/events.js
(function() {

  var _queue = [];
  var _listeners = {};

  var SparkEvents = {
    emit: function(type, payload) {
      var evt = {
        type: type,
        payload: payload || {},
        timestamp: Date.now()
      };
      _queue.push(evt);
      var fns = _listeners[type];
      if (fns) {
        for (var i = 0; i < fns.length; i++) {
          try { fns[i](evt); } catch (e) { console.error("SparkEvents listener error:", e); }
        }
      }
    },

    getPending: function() {
      return _queue.slice();
    },

    clear: function() {
      _queue = [];
    },

    on: function(type, fn) {
      if (!_listeners[type]) _listeners[type] = [];
      _listeners[type].push(fn);
    },

    off: function(type, fn) {
      if (!fn) { delete _listeners[type]; return; }
      var fns = _listeners[type];
      if (!fns) return;
      _listeners[type] = fns.filter(function(f) { return f !== fn; });
    }
  };

  window.SparkEvents = SparkEvents;
})();
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node tests/test_spark_core.js`
Expected: All 10 tests PASS

- [ ] **Step 5: Commit**

```bash
git add js/spark-core/events.js tests/test_spark_core.js
git commit -m "feat(core): add spark-core event queue with listeners"
```

---

## Task 3: Progress Engine

**Files:**
- Create: `js/spark-core/progress-engine.js`
- Modify: `tests/test_spark_core.js`

- [ ] **Step 1: Add progress engine tests**

Append to test file:

```js
eval(loadJS('js/spark-core/progress-engine.js'));

console.log('\n--- SparkCore: Progress Engine ---');

test('awardXp adds to app stats', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  SparkProgress.awardXp(p, 'chordspark', 25);
  assert.strictEqual(p.apps.chordspark.stats.xp, 25);
});

test('awardXp accumulates', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  SparkProgress.awardXp(p, 'chordspark', 10);
  SparkProgress.awardXp(p, 'chordspark', 15);
  assert.strictEqual(p.apps.chordspark.stats.xp, 25);
});

test('completeLesson marks lesson done and awards xp', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  SparkProgress.completeLesson(p, 'chordspark', 'lesson_1', { xp: 25, accuracy: 90 });
  assert.ok(p.apps.chordspark.completedLessonIds.indexOf('lesson_1') >= 0);
  assert.strictEqual(p.apps.chordspark.stats.lessonsCompleted, 1);
  assert.strictEqual(p.apps.chordspark.stats.xp, 25);
});

test('completeLesson is idempotent', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  SparkProgress.completeLesson(p, 'chordspark', 'lesson_1', { xp: 25 });
  SparkProgress.completeLesson(p, 'chordspark', 'lesson_1', { xp: 25 });
  assert.strictEqual(p.apps.chordspark.completedLessonIds.length, 1);
  assert.strictEqual(p.apps.chordspark.stats.lessonsCompleted, 1);
  assert.strictEqual(p.apps.chordspark.stats.xp, 25);
});

test('completeSession increments session count', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  SparkProgress.completeSession(p, 'chordspark', 'practice', { xp: 10 });
  assert.strictEqual(p.apps.chordspark.stats.sessionsCompleted, 1);
  assert.strictEqual(p.apps.chordspark.stats.xp, 10);
});

test('updateStreak increments on new day', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  p.apps.chordspark._lastStreakDate = '2026-03-30';
  SparkProgress.updateStreak(p, 'chordspark', '2026-03-31');
  assert.strictEqual(p.apps.chordspark.stats.streakDays, 1);
});

test('updateStreak resets on gap day', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  p.apps.chordspark.stats.streakDays = 5;
  p.apps.chordspark._lastStreakDate = '2026-03-28';
  SparkProgress.updateStreak(p, 'chordspark', '2026-03-31');
  assert.strictEqual(p.apps.chordspark.stats.streakDays, 1);
});

test('updateStreak no-ops on same day', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  p.apps.chordspark.stats.streakDays = 3;
  p.apps.chordspark._lastStreakDate = '2026-03-31';
  SparkProgress.updateStreak(p, 'chordspark', '2026-03-31');
  assert.strictEqual(p.apps.chordspark.stats.streakDays, 3);
});

test('unlock adds to unlockedIds', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  SparkProgress.unlock(p, 'chordspark', 'drill_open_chords_1');
  assert.ok(p.apps.chordspark.unlockedIds.indexOf('drill_open_chords_1') >= 0);
});

test('unlock is idempotent', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  SparkProgress.unlock(p, 'chordspark', 'item_1');
  SparkProgress.unlock(p, 'chordspark', 'item_1');
  assert.strictEqual(p.apps.chordspark.unlockedIds.length, 1);
});

test('recordDrillAnswer updates mastery', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  SparkProgress.recordDrillAnswer(p, 'chordspark', 'chord_em', true, 90);
  assert.ok(p.apps.chordspark.mastery['chord_em'] > 0);
});
```

- [ ] **Step 2: Run test to verify failures**

Run: `node tests/test_spark_core.js`
Expected: FAIL — `SparkProgress` is not defined

- [ ] **Step 3: Implement progress-engine.js**

```js
// js/spark-core/progress-engine.js
(function() {

  function _daysBetween(dateA, dateB) {
    var a = new Date(dateA + "T00:00:00Z");
    var b = new Date(dateB + "T00:00:00Z");
    return Math.round((b - a) / 86400000);
  }

  var SparkProgress = {
    awardXp: function(profile, appId, amount) {
      var app = profile.apps[appId];
      if (!app) return;
      app.stats.xp += amount;
    },

    completeLesson: function(profile, appId, lessonId, meta) {
      var app = profile.apps[appId];
      if (!app) return;
      meta = meta || {};
      if (app.completedLessonIds.indexOf(lessonId) >= 0) return;
      app.completedLessonIds.push(lessonId);
      app.stats.lessonsCompleted++;
      if (meta.xp) app.stats.xp += meta.xp;
    },

    completeSession: function(profile, appId, sessionType, meta) {
      var app = profile.apps[appId];
      if (!app) return;
      meta = meta || {};
      app.stats.sessionsCompleted++;
      if (meta.xp) app.stats.xp += meta.xp;
    },

    recordDrillAnswer: function(profile, appId, skillId, isCorrect, accuracy) {
      var app = profile.apps[appId];
      if (!app) return;
      var score = isCorrect ? (accuracy || 100) : 0;
      if (typeof calculateMasteryFromAccuracy === "function") {
        app.mastery[skillId] = calculateMasteryFromAccuracy(app.mastery[skillId], score);
      } else {
        var prev = app.mastery[skillId] || 0;
        app.mastery[skillId] = prev * 0.7 + score * 0.3;
      }
    },

    updateStreak: function(profile, appId, isoDate) {
      var app = profile.apps[appId];
      if (!app) return;
      var last = app._lastStreakDate;
      if (last === isoDate) return;
      if (last && _daysBetween(last, isoDate) === 1) {
        app.stats.streakDays++;
      } else {
        app.stats.streakDays = 1;
      }
      app._lastStreakDate = isoDate;
    },

    unlock: function(profile, appId, unlockId) {
      var app = profile.apps[appId];
      if (!app) return;
      if (app.unlockedIds.indexOf(unlockId) >= 0) return;
      app.unlockedIds.push(unlockId);
    },

    startSession: function(profile, appId, sessionType) {
      // Hook point — emit event, no state change needed
    }
  };

  window.SparkProgress = SparkProgress;
})();
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node tests/test_spark_core.js`
Expected: All 21 tests PASS

- [ ] **Step 5: Commit**

```bash
git add js/spark-core/progress-engine.js tests/test_spark_core.js
git commit -m "feat(core): add spark-core progress engine with pure functions"
```

---

## Task 4: Achievements

**Files:**
- Create: `js/spark-core/achievements.js`
- Modify: `tests/test_spark_core.js`

- [ ] **Step 1: Add achievement tests**

```js
eval(loadJS('js/spark-core/achievements.js'));

console.log('\n--- SparkCore: Achievements ---');

test('evaluateAchievements returns empty for fresh profile', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  var earned = SparkAchievements.evaluate(p);
  assert.strictEqual(earned.length, 0);
});

test('evaluateAchievements awards first_lesson', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  p.apps.chordspark.stats.lessonsCompleted = 1;
  var earned = SparkAchievements.evaluate(p);
  assert.ok(earned.indexOf('first_lesson') >= 0);
});

test('evaluateAchievements awards streak_3', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  p.apps.chordspark.stats.streakDays = 3;
  var earned = SparkAchievements.evaluate(p);
  assert.ok(earned.indexOf('streak_3') >= 0);
});

test('evaluateAchievements awards dual_instrument when both apps have lessons', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  SparkProfile.ensureApp(p, 'pianospark', 'piano');
  p.apps.chordspark.stats.lessonsCompleted = 1;
  p.apps.pianospark.stats.lessonsCompleted = 1;
  var earned = SparkAchievements.evaluate(p);
  assert.ok(earned.indexOf('dual_instrument_starter') >= 0);
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `node tests/test_spark_core.js`
Expected: FAIL — `SparkAchievements` not defined

- [ ] **Step 3: Implement achievements.js**

```js
// js/spark-core/achievements.js
(function() {

  var SUITE_ACHIEVEMENTS = [
    { id: "first_lesson", check: function(p) {
      for (var appId in p.apps) { if (p.apps[appId].stats.lessonsCompleted >= 1) return true; }
      return false;
    }},
    { id: "first_session", check: function(p) {
      for (var appId in p.apps) { if (p.apps[appId].stats.sessionsCompleted >= 1) return true; }
      return false;
    }},
    { id: "streak_3", check: function(p) {
      for (var appId in p.apps) { if (p.apps[appId].stats.streakDays >= 3) return true; }
      return false;
    }},
    { id: "streak_7", check: function(p) {
      for (var appId in p.apps) { if (p.apps[appId].stats.streakDays >= 7) return true; }
      return false;
    }},
    { id: "xp_100", check: function(p) {
      for (var appId in p.apps) { if (p.apps[appId].stats.xp >= 100) return true; }
      return false;
    }},
    { id: "xp_1000", check: function(p) {
      for (var appId in p.apps) { if (p.apps[appId].stats.xp >= 1000) return true; }
      return false;
    }},
    { id: "dual_instrument_starter", check: function(p) {
      var count = 0;
      for (var appId in p.apps) { if (p.apps[appId].stats.lessonsCompleted >= 1) count++; }
      return count >= 2;
    }}
  ];

  var SparkAchievements = {
    definitions: SUITE_ACHIEVEMENTS,

    evaluate: function(profile) {
      var existing = profile.suiteRewards ? profile.suiteRewards.badges : [];
      var newlyEarned = [];
      for (var i = 0; i < SUITE_ACHIEVEMENTS.length; i++) {
        var a = SUITE_ACHIEVEMENTS[i];
        if (existing.indexOf(a.id) >= 0) continue;
        if (a.check(profile)) newlyEarned.push(a.id);
      }
      return newlyEarned;
    },

    applyEarned: function(profile, earnedIds) {
      if (!profile.suiteRewards) profile.suiteRewards = { badges: [], cosmetics: [], challengeProgress: {} };
      for (var i = 0; i < earnedIds.length; i++) {
        if (profile.suiteRewards.badges.indexOf(earnedIds[i]) < 0) {
          profile.suiteRewards.badges.push(earnedIds[i]);
        }
      }
    }
  };

  window.SparkAchievements = SparkAchievements;
})();
```

- [ ] **Step 4: Run tests**

Run: `node tests/test_spark_core.js`
Expected: All 25 tests PASS

- [ ] **Step 5: Commit**

```bash
git add js/spark-core/achievements.js tests/test_spark_core.js
git commit -m "feat(core): add spark-core achievements with suite-wide badges"
```

---

## Task 5: Content Schema and Normalizer

**Files:**
- Create: `js/spark-core/content-schema.js`
- Create: `js/spark-core/content-normalizer.js`
- Create: `content/spark_content.schema.json`
- Create: `content/spark_profile.schema.json`
- Create: `content/examples/chordspark.sample.json`
- Create: `content/examples/pianospark.sample.json`
- Modify: `tests/test_spark_core.js`

- [ ] **Step 1: Add content tests**

```js
eval(loadJS('js/spark-core/content-schema.js'));
eval(loadJS('js/spark-core/content-normalizer.js'));

console.log('\n--- SparkCore: Content ---');

test('validateContent rejects missing appId', function() {
  var result = SparkContent.validate({ schemaVersion: 1, units: [] });
  assert.strictEqual(result.valid, false);
});

test('validateContent accepts valid content', function() {
  var result = SparkContent.validate({
    schemaVersion: 1, appId: 'chordspark', instrument: 'guitar', title: 'Test', units: []
  });
  assert.strictEqual(result.valid, true);
});

test('normalizeChordSparkContent converts GUITAR_SESSIONS shape', function() {
  var raw = [{ num: 1, title: 'Test Session', level: 1, bpm: 60,
    spark: { chord: 'E Minor', desc: 'test' },
    newMove: { chord: 'E Minor', desc: 'test' },
    victoryLap: { drill: '2chord', chords: ['E Minor'] }
  }];
  var content = SparkContentNormalizer.fromChordSparkSessions(raw, 'chordspark');
  assert.strictEqual(content.appId, 'chordspark');
  assert.strictEqual(content.units.length, 1);
  assert.ok(content.units[0].lessons.length > 0);
});

test('getLessonById finds lesson', function() {
  var content = {
    units: [{ id: 'u1', lessons: [{ id: 'L1', title: 'Test' }] }]
  };
  var lesson = SparkContentNormalizer.getLessonById(content, 'L1');
  assert.ok(lesson);
  assert.strictEqual(lesson.title, 'Test');
});

test('getLessonById returns null for missing', function() {
  var content = { units: [{ id: 'u1', lessons: [] }] };
  assert.strictEqual(SparkContentNormalizer.getLessonById(content, 'nope'), null);
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `node tests/test_spark_core.js`
Expected: FAIL — `SparkContent` not defined

- [ ] **Step 3: Implement content-schema.js**

```js
// js/spark-core/content-schema.js
(function() {

  var SparkContent = {
    validate: function(content) {
      var errors = [];
      if (!content) return { valid: false, errors: ["Content is null"] };
      if (!content.appId) errors.push("Missing appId");
      if (!content.schemaVersion) errors.push("Missing schemaVersion");
      if (!Array.isArray(content.units)) errors.push("Missing units array");
      if (content.units) {
        for (var i = 0; i < content.units.length; i++) {
          var unit = content.units[i];
          if (!unit.id) errors.push("Unit " + i + ": missing id");
          if (!Array.isArray(unit.lessons)) errors.push("Unit " + i + ": missing lessons array");
        }
      }
      return { valid: errors.length === 0, errors: errors };
    }
  };

  window.SparkContent = SparkContent;
})();
```

- [ ] **Step 4: Implement content-normalizer.js**

```js
// js/spark-core/content-normalizer.js
(function() {

  var SparkContentNormalizer = {
    fromChordSparkSessions: function(sessions, appId) {
      var units = [];
      for (var i = 0; i < sessions.length; i++) {
        var s = sessions[i];
        var lessonId = "guided_session_" + s.num;
        units.push({
          id: "unit_session_" + s.num,
          title: s.title || ("Session " + s.num),
          lessons: [{
            id: lessonId,
            type: "guided",
            title: s.title,
            objectives: [s.spark ? s.spark.desc : "", s.newMove ? s.newMove.desc : ""],
            skills: ["recognition", "switching"],
            difficulty: s.level || 1,
            instrumentData: {
              guitar: {
                chords: s.newMove ? [s.newMove.chord] : [],
                diagrams: [],
                audioKeys: []
              }
            },
            rewards: { xp: 30, unlockIds: [] }
          }]
        });
      }
      return {
        schemaVersion: 1,
        appId: appId || "chordspark",
        instrument: "guitar",
        title: "ChordSpark Guided Sessions",
        units: units
      };
    },

    getLessonById: function(content, lessonId) {
      if (!content || !content.units) return null;
      for (var i = 0; i < content.units.length; i++) {
        var lessons = content.units[i].lessons || [];
        for (var j = 0; j < lessons.length; j++) {
          if (lessons[j].id === lessonId) return lessons[j];
        }
      }
      return null;
    }
  };

  window.SparkContentNormalizer = SparkContentNormalizer;
})();
```

- [ ] **Step 5: Create JSON schema files and examples**

Create `content/spark_content.schema.json`, `content/spark_profile.schema.json`, `content/examples/chordspark.sample.json`, `content/examples/pianospark.sample.json` using the shapes defined in the handoff V2 spec (sections "Shared Content Shape" and "Shared Profile Shape").

- [ ] **Step 6: Run tests**

Run: `node tests/test_spark_core.js`
Expected: All 30 tests PASS

- [ ] **Step 7: Commit**

```bash
git add js/spark-core/content-schema.js js/spark-core/content-normalizer.js content/ tests/test_spark_core.js
git commit -m "feat(core): add content schema, normalizer, and suite JSON schemas"
```

---

## Task 6: spark-core Index and Script Loading

**Files:**
- Create: `js/spark-core/index.js`
- Modify: `index.html`

- [ ] **Step 1: Create index.js barrel**

```js
// js/spark-core/index.js
// Barrel — all spark-core modules are loaded as individual scripts.
// This file exists as a namespace convenience and suite version marker.
(function() {
  window.SparkCore = {
    version: "0.1.0",
    Profile: window.SparkProfile,
    Storage: window.SparkStorage,
    Events: window.SparkEvents,
    Progress: window.SparkProgress,
    Achievements: window.SparkAchievements,
    Content: window.SparkContent,
    ContentNormalizer: window.SparkContentNormalizer
  };
})();
```

- [ ] **Step 2: Add script tags to index.html**

Insert after `js/core/performance/result_contracts.js` (line 40) and before `js/data.js` (line 42):

```html
<!-- Spark Suite Core -->
<script src="js/spark-core/profile-schema.js"></script>
<script src="js/spark-core/storage.js"></script>
<script src="js/spark-core/events.js"></script>
<script src="js/spark-core/progress-engine.js"></script>
<script src="js/spark-core/achievements.js"></script>
<script src="js/spark-core/content-schema.js"></script>
<script src="js/spark-core/content-normalizer.js"></script>
<script src="js/spark-core/index.js"></script>
```

- [ ] **Step 3: Verify app still loads**

Run: `npm start` (Electron) or open `index.html` in browser. Confirm no console errors and app works normally.

- [ ] **Step 4: Commit**

```bash
git add js/spark-core/index.js index.html
git commit -m "feat(core): add spark-core barrel and wire into index.html"
```

---

## Task 7: Performance-Core Contracts

**Files:**
- Create: `js/performance-core/chart-contract.js`
- Create: `js/performance-core/transport-contract.js`
- Create: `js/performance-core/spark-highway-adapter.js`
- Create: `js/performance-core/performance-events.js`
- Create: `js/performance-core/index.js`
- Create: `tests/test_performance_core.js`

- [ ] **Step 1: Create test file**

```js
// tests/test_performance_core.js
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log('  PASS: ' + name); }
  catch (e) { failed++; console.error('  FAIL: ' + name + '\n    ' + e.message); }
}

global.window = global;
global.performance = { now: function() { return Date.now(); } };
global.SparkEvents = { emit: function() {}, clear: function() {}, getPending: function() { return []; }, on: function() {}, off: function() {} };

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
}

eval(loadJS('js/performance-core/chart-contract.js'));
eval(loadJS('js/performance-core/transport-contract.js'));
eval(loadJS('js/performance-core/performance-events.js'));

console.log('\n--- PerformanceCore: Chart Contract ---');

test('normalizeChartEvents adds missing _scored flags', function() {
  var events = [{ t: 0, dur: 1, type: 'chord', notes: ['E','G','B'], laneLabel: 'Em' }];
  var result = PerfChartContract.normalizeEvents(events);
  assert.strictEqual(result[0]._scored, false);
  assert.strictEqual(result[0]._hit, false);
});

test('normalizeChartEvents sorts by time', function() {
  var events = [
    { t: 2, dur: 1, type: 'chord', notes: ['G'], laneLabel: 'G' },
    { t: 0, dur: 1, type: 'chord', notes: ['E'], laneLabel: 'E' }
  ];
  var result = PerfChartContract.normalizeEvents(events);
  assert.strictEqual(result[0].t, 0);
  assert.strictEqual(result[1].t, 2);
});

test('validateEvent rejects missing notes', function() {
  var result = PerfChartContract.validateEvent({ t: 0, dur: 1, type: 'chord' });
  assert.strictEqual(result.valid, false);
});

test('validateEvent accepts valid chord event', function() {
  var result = PerfChartContract.validateEvent({ t: 0, dur: 1, type: 'chord', notes: ['C','E','G'], laneLabel: 'C' });
  assert.strictEqual(result.valid, true);
});

console.log('\n--- PerformanceCore: Transport Contract ---');

test('wall-clock mode returns elapsed time', function() {
  var state = PerfTransportContract.createState();
  PerfTransportContract.setMode(state, 'wall-clock');
  PerfTransportContract.start(state, 0);
  // Immediately after start, now() should be near 0
  var t = PerfTransportContract.now(state);
  assert.ok(t >= 0 && t < 0.5, 'should be near 0, got ' + t);
});

test('audio-clock mode returns audioEl currentTime', function() {
  var state = PerfTransportContract.createState();
  PerfTransportContract.setMode(state, 'audio-clock');
  var fakeAudio = { currentTime: 5.5, paused: false, ended: false };
  PerfTransportContract.setAudioSource(state, fakeAudio);
  PerfTransportContract.start(state, 0);
  assert.strictEqual(PerfTransportContract.now(state), 5.5);
});

test('mode defaults to wall-clock', function() {
  var state = PerfTransportContract.createState();
  assert.strictEqual(state.mode, 'wall-clock');
});

console.log('\n--- PerformanceCore: Performance Events ---');

test('emitPerformanceEvent calls SparkEvents.emit', function() {
  var captured = [];
  var orig = SparkEvents.emit;
  SparkEvents.emit = function(type, payload) { captured.push({ type: type, payload: payload }); };
  PerfEvents.emit('performance_started', { chartId: 'test' });
  SparkEvents.emit = orig;
  assert.strictEqual(captured.length, 1);
  assert.strictEqual(captured[0].type, 'performance_started');
});

// Summary
console.log('\n' + '='.repeat(40));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('='.repeat(40));
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: Run test to verify failure**

Run: `node tests/test_performance_core.js`
Expected: FAIL — modules not found

- [ ] **Step 3: Implement chart-contract.js**

```js
// js/performance-core/chart-contract.js
(function() {

  var PerfChartContract = {
    normalizeEvents: function(events) {
      var result = [];
      for (var i = 0; i < events.length; i++) {
        var evt = Object.assign ? Object.assign({}, events[i]) : JSON.parse(JSON.stringify(events[i]));
        if (evt._scored === undefined) evt._scored = false;
        if (evt._hit === undefined) evt._hit = false;
        if (evt._miss === undefined) evt._miss = false;
        if (evt._result === undefined) evt._result = null;
        if (evt._score === undefined) evt._score = 0;
        result.push(evt);
      }
      result.sort(function(a, b) { return a.t - b.t; });
      return result;
    },

    validateEvent: function(evt) {
      var errors = [];
      if (typeof evt.t !== "number" || evt.t < 0) errors.push("Invalid time");
      if (evt.type === "chord" && (!Array.isArray(evt.notes) || evt.notes.length === 0)) errors.push("Chord event missing notes");
      if (!evt.laneLabel) errors.push("Missing laneLabel");
      return { valid: errors.length === 0, errors: errors };
    }
  };

  window.PerfChartContract = PerfChartContract;
})();
```

- [ ] **Step 4: Implement transport-contract.js**

```js
// js/performance-core/transport-contract.js
(function() {

  var PerfTransportContract = {
    createState: function() {
      return {
        mode: "wall-clock",
        _playing: false,
        _startedPerfMs: 0,
        _offsetSec: 0,
        _pausedSec: 0,
        _speed: 1,
        _audioSource: null
      };
    },

    setMode: function(state, mode) {
      state.mode = mode; // "wall-clock" | "audio-clock"
    },

    setAudioSource: function(state, audioEl) {
      state._audioSource = audioEl;
    },

    start: function(state, fromSec) {
      state._offsetSec = fromSec || 0;
      state._startedPerfMs = performance.now();
      state._playing = true;
      state._pausedSec = 0;
    },

    now: function(state) {
      if (state.mode === "audio-clock" && state._audioSource) {
        var a = state._audioSource;
        if (!a.paused && !a.ended) return a.currentTime;
      }
      if (!state._playing) return state._pausedSec;
      var elapsedMs = performance.now() - state._startedPerfMs;
      return state._offsetSec + (elapsedMs / 1000) * state._speed;
    }
  };

  window.PerfTransportContract = PerfTransportContract;
})();
```

- [ ] **Step 5: Implement performance-events.js**

```js
// js/performance-core/performance-events.js
(function() {

  var PerfEvents = {
    emit: function(type, payload) {
      if (typeof SparkEvents !== "undefined" && SparkEvents.emit) {
        SparkEvents.emit(type, payload);
      }
    }
  };

  window.PerfEvents = PerfEvents;
})();
```

- [ ] **Step 6: Implement spark-highway-adapter.js**

```js
// js/performance-core/spark-highway-adapter.js
// Adapter seam for the shared SparkHighway renderer.
// Currently delegates to the existing SparkHighway class in spark-highway.js.
// When a shared renderer is extracted to Dev/shared/spark-highway.js,
// only this file needs to change.
(function() {

  var PerfHighwayAdapter = {
    create: function(canvasEl, skinConfig) {
      if (typeof SparkHighway === "undefined") {
        console.error("PerfHighwayAdapter: SparkHighway not loaded");
        return null;
      }
      return new SparkHighway(canvasEl, skinConfig || SparkHighway.GUITAR_SKIN);
    },

    setChart: function(renderer, events, phrases) {
      if (renderer && renderer.setChart) renderer.setChart(events, phrases);
    },

    update: function(renderer, currentTimeSec, combo) {
      if (renderer && renderer.update) renderer.update(currentTimeSec, combo);
    },

    notifyHit: function(renderer, x, y, color) {
      if (renderer && renderer.notifyHit) renderer.notifyHit(x, y, color);
    },

    destroy: function(renderer) {
      if (renderer && renderer.destroy) renderer.destroy();
    }
  };

  window.PerfHighwayAdapter = PerfHighwayAdapter;
})();
```

- [ ] **Step 7: Create index.js barrel**

```js
// js/performance-core/index.js
(function() {
  window.PerformanceCore = {
    version: "0.1.0",
    ChartContract: window.PerfChartContract,
    TransportContract: window.PerfTransportContract,
    HighwayAdapter: window.PerfHighwayAdapter,
    Events: window.PerfEvents
  };
})();
```

- [ ] **Step 8: Run tests**

Run: `node tests/test_performance_core.js`
Expected: All 8 tests PASS

- [ ] **Step 9: Commit**

```bash
git add js/performance-core/ tests/test_performance_core.js
git commit -m "feat(performance): add chart contract, transport contract, highway adapter, and perf events"
```

---

## Task 8: Wire performance-core into index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add script tags after spark-core, before performance modules**

Insert after the spark-core scripts and before `js/performance/config.js`:

```html
<!-- Performance Core Contracts -->
<script src="js/performance-core/chart-contract.js"></script>
<script src="js/performance-core/transport-contract.js"></script>
<script src="js/performance-core/spark-highway-adapter.js"></script>
<script src="js/performance-core/performance-events.js"></script>
<script src="js/performance-core/index.js"></script>
```

- [ ] **Step 2: Verify app loads without errors**

Run: `npm start` or open in browser. Check console for errors.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(performance): wire performance-core into index.html"
```

---

## Task 9: Add Event Emission to app.js

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Add SparkEvents.emit calls at key progression points**

Add at the top of the `act` function body or nearby init area:

```js
// Helper to emit suite events safely
function _sparkEmit(type, payload) {
  if (typeof SparkEvents !== "undefined") SparkEvents.emit(type, payload);
}
```

Then add `_sparkEmit()` calls at these existing progression points (do NOT change existing behavior, just add emission alongside):

At session completion (near `logHistory("session", ...)`, around line 38):
```js
_sparkEmit("practice_session_completed", { appId: "chordspark", type: "session", xp: xpEarned, chord: k });
```

At drill completion (near `logHistory("drill", ...)`, around line 55):
```js
_sparkEmit("practice_session_completed", { appId: "chordspark", type: "drill", xp: 20, detail: detail });
```

At quiz correct (near `logHistory("quiz", ...)`, around line 427):
```js
_sparkEmit("drill_answered", { appId: "chordspark", skillId: S.quizQ.name, correct: true, xp: 10 });
```

At guided session completion (near `logHistory("guided", ...)`, around line 659):
```js
_sparkEmit("lesson_completed", { appId: "chordspark", lessonId: "guided_" + plan.num, xp: 30 });
```

At song completion (near `logHistory("song", ...)`, around line 498):
```js
_sparkEmit("lesson_completed", { appId: "chordspark", lessonId: "song_" + (S.selectedSong ? S.selectedSong.title : ""), xp: 40 });
```

At performance finish (in `finishPerformance()` in `js/performance/session.js`, near `S.screen = SCR.PERFORM_DONE`):
```js
if (typeof PerfEvents !== "undefined") PerfEvents.emit("performance_completed", {
  chartId: S.performChartId, accuracy: S.performResults.accuracy, stars: S.performResults.stars, score: S.performResults.score
});
```

- [ ] **Step 2: Verify app works and events emit**

Open browser console, run: `SparkEvents.on('practice_session_completed', function(e) { console.log('EVENT:', e); });`
Complete a session. Verify event logged.

- [ ] **Step 3: Commit**

```bash
git add js/app.js js/performance/session.js
git commit -m "refactor(chordspark): emit spark events at progression points"
```

---

## Task 10: Docs and Contract Documentation

**Files:**
- Create: `docs/spark-highway-contract.md`

- [ ] **Step 1: Write highway contract doc**

```markdown
# SparkHighway Renderer Contract

## Overview
SparkHighway is a shared Canvas 2D note highway renderer used by both ChordSpark and PianoSpark.

## API

### Constructor
`new SparkHighway(canvasElement, skinConfig)`

### Methods
- `setChart(events, phrases)` — Load chart data for rendering
- `update(currentTimeSec, combo)` — Render one frame at the given time
- `notifyHit(x, y, color)` — Trigger particle burst at position
- `destroy()` — Clean up resources

### Skin Configs
- `SparkHighway.GUITAR_SKIN` — 6 lanes, circular gems, button indicators
- `SparkHighway.PIANO_SKIN` — 24 lanes, rectangular notes, key indicators

## What SparkHighway Owns
- Lane geometry and perspective projection
- Note/gem drawing with approach animation
- Strike line rendering
- Lane indicator rendering (guitar buttons / piano keys)
- Fret bar timing markers
- Combo flame visual effect
- Particle burst effects

## What SparkHighway Does NOT Own
- Scoring logic
- Profile/progress persistence
- Audio playback or transport timing
- Chart loading or validation
- Input handling (MIDI/mic)

## Chart Event Shape
Events passed to `setChart()`:
```js
{ t, dur, type, chord, notes, laneLabel, strum, _scored, _hit, _miss, _result, _score }
```

## Integration
Apps should use `PerfHighwayAdapter` (js/performance-core/spark-highway-adapter.js) rather than calling SparkHighway directly.
```

- [ ] **Step 2: Commit**

```bash
git add docs/
git commit -m "docs: add spark-highway contract and suite documentation"
```

---

## Task 11: Add Test Summary Sections

**Files:**
- Modify: `tests/test_spark_core.js`

- [ ] **Step 1: Add summary footer to test_spark_core.js**

Append at the very end of the file:

```js
// ===== Summary =====
console.log('\n' + '='.repeat(40));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('='.repeat(40));
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: Run both test suites**

Run: `node tests/test_spark_core.js && node tests/test_performance_core.js`
Expected: All tests PASS in both suites

- [ ] **Step 3: Verify existing tests still pass**

Run: `npm test`
Expected: All existing tests PASS

- [ ] **Step 4: Commit**

```bash
git add tests/
git commit -m "test(core): finalize spark-core and performance-core test suites"
```

---

## Task 12: TODO Markers for PianoSpark Adoption

**Files:**
- Modify: `js/spark-core/content-normalizer.js`
- Modify: `js/performance-core/spark-highway-adapter.js`

- [ ] **Step 1: Add TODO markers**

In `content-normalizer.js`, add after `fromChordSparkSessions`:

```js
    // TODO(pianospark): Add fromPianoSparkSessions(sessions, appId) normalizer
    // when PianoSpark adopts spark-core. PianoSpark content follows the same
    // lesson structure but uses keyboard voicings instead of chord diagrams.
```

In `spark-highway-adapter.js`, add after the `create` method:

```js
    // TODO(pianospark): When PianoSpark adopts performance-core, pass
    // SparkHighway.PIANO_SKIN instead of GUITAR_SKIN. The adapter should
    // accept an instrument parameter to select the correct skin.
```

- [ ] **Step 2: Commit**

```bash
git add js/spark-core/content-normalizer.js js/performance-core/spark-highway-adapter.js
git commit -m "chore: add TODO markers for PianoSpark adoption"
```
