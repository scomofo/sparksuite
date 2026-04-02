# SparkSuite Unified App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge ChordSpark and PianoSpark into a single SparkSuite app with a launcher shell, instrument registration system, and unified repo.

**Architecture:** Fork ChordSpark to `sparksuite/`, add a launcher screen and `SparkInstruments` registry, refactor guitar-specific code into `js/instruments/guitar/`, port PianoSpark-specific code into `js/instruments/piano/`. Shared systems (performance, editor, analytics, meta, etc.) stay in place. The render pipeline gains a launcher gate: when `S.activeInstrument` is null, the launcher renders; otherwise, the active instrument's page map handles routing.

**Tech Stack:** Vanilla JS (browser globals), Electron, Canvas 2D (SparkHighway), localStorage, Node.js assert for tests.

**Existing code to know about:**
- `js/app.js` — 77KB, contains `render()`, `_renderInner()`, `act()` dispatcher, screen routing (lines 1558-1592), all guitar page renderers
- `js/data.js` — `SCR` screen constants, `TAB` tab constants, `GUITAR_CHORDS`, `GUITAR_SESSIONS`, songs, chord data
- `js/state.js` — global `S` object with ~250 fields, `PERSIST_FIELDS` array, `saveState()`/`loadState()`
- `js/ui.js` — `escHTML()`, `chordSVG()`, shared UI helpers
- `js/spark-core/` — `SparkProfile`, `SparkStorage`, `SparkEvents`, `SparkProgress`, `SparkAchievements`
- `js/spark-highway.js` — `SparkHighway` with `GUITAR_SKIN` and `PIANO_SKIN`
- `index.html` — ~235 script tags in load order
- `main.js` — Electron main process
- `package.json` — Electron + electron-builder config

**PianoSpark code at:** `C:\Users\Scott Morley\Dev\pianospark\`
- Same module structure as ChordSpark
- `js/data.js` has piano-specific `PIANO_CHORDS` (different from ChordSpark's dual-view `PIANO_CHORDS`), songs, exercises
- `js/state.js` has piano-specific state fields
- `js/app.js` has piano page renderers and act() dispatcher
- `js/audio.js` has piano sample loading

---

## File Structure

### New files to create
- `js/launcher.js` — SparkInstruments registry + launcher page renderer
- `js/instruments/guitar/register.js` — guitar instrument registration
- `js/instruments/guitar/data.js` — guitar-specific data (chords, sessions, songs)
- `js/instruments/guitar/pages.js` — guitar-specific page renderers (extracted from app.js)
- `js/instruments/piano/register.js` — piano instrument registration
- `js/instruments/piano/data.js` — piano-specific data (from pianospark)
- `js/instruments/piano/pages.js` — piano-specific page renderers (from pianospark)
- `js/instruments/piano/audio.js` — piano audio loading (from pianospark)
- `tests/test_launcher.js` — launcher and instrument registry tests

### Files to modify
- `package.json` — rename to SparkSuite
- `main.js` — update window title
- `index.html` — update title, add launcher + instrument script tags
- `js/data.js` — add `SCR.LAUNCHER`, move guitar-specific data to instrument module
- `js/state.js` — add `S.activeInstrument`, add to `PERSIST_FIELDS`
- `js/app.js` — add launcher gate to `_renderInner()`, add instrument back button to header

---

## Task 1: Create sparksuite repo from chordspark

**Files:**
- Copy entire `chordspark/` to `sparksuite/`
- Modify: `package.json`
- Modify: `main.js`
- Modify: `index.html`

- [ ] **Step 1: Copy the repo**

```bash
cp -r "C:/Users/Scott Morley/Dev/chordspark" "C:/Users/Scott Morley/Dev/sparksuite"
cd "C:/Users/Scott Morley/Dev/sparksuite"
```

- [ ] **Step 2: Initialize fresh git**

```bash
cd "C:/Users/Scott Morley/Dev/sparksuite"
rm -rf .git
git init
git add -A
git commit -m "init: fork from ChordSpark as SparkSuite base"
```

- [ ] **Step 3: Update package.json identity**

In `package.json`, change:
- `"name"` to `"sparksuite"`
- `"productName"` to `"SparkSuite"`
- `"description"` to `"Multi-instrument music learning suite"`
- In `build.appId`, change to `"com.sparksuite.app"`
- In `build.win.artifactName`, change to `"SparkSuite-Setup-${version}.${ext}"`

- [ ] **Step 4: Update main.js window title**

Find the line setting `title:` in the BrowserWindow creation and change it to `"SparkSuite"`.

- [ ] **Step 5: Update index.html title**

Change `<title>ChordSpark</title>` to `<title>SparkSuite</title>`.

- [ ] **Step 6: Update the onboarding welcome text in app.js**

Find `Welcome to ChordSpark!` (around line 1545) and change to `Welcome to SparkSuite!`. Find `I will open ChordSpark` and change to `I will open SparkSuite`.

- [ ] **Step 7: Update header logo text**

In `index.html`, find `<span class="logo-text">ChordSpark</span>` and change to `<span class="logo-text">SparkSuite</span>`. Change the guitar emoji `&#127928;` to a music note `&#127925;`.

- [ ] **Step 8: Verify app still loads**

```bash
cd "C:/Users/Scott Morley/Dev/sparksuite"
npm start
```

Expected: Electron opens with "SparkSuite" in title bar. All existing guitar functionality works.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: rebrand ChordSpark to SparkSuite"
```

---

## Task 2: Add SparkInstruments Registry and Launcher

**Files:**
- Create: `js/launcher.js`
- Create: `tests/test_launcher.js`
- Modify: `js/data.js` (add SCR.LAUNCHER)
- Modify: `js/state.js` (add S.activeInstrument)
- Modify: `index.html` (add script tag)

- [ ] **Step 1: Create test file**

```js
// tests/test_launcher.js
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log('  PASS: ' + name); }
  catch (e) { failed++; console.error('  FAIL: ' + name + '\n    ' + e.message); }
}

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
global.SparkProfile = { createEmpty: function() { return { schemaVersion: 1, suite: 'spark', userId: 'local-user', apps: {}, suiteRewards: { badges: [], cosmetics: [], challengeProgress: {} } }; } };
global.SparkStorage = { load: function() { return SparkProfile.createEmpty(); } };
global.SparkHighway = { GUITAR_SKIN: { laneCount: 6 }, PIANO_SKIN: { laneCount: 24 } };
global.escHTML = function(s) { return String(s); };

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
}

eval(loadJS('js/launcher.js'));

console.log('\n--- SparkSuite: Launcher ---');

test('SparkInstruments starts with no instruments', function() {
  assert.strictEqual(SparkInstruments.getAll().length, 0);
});

test('register adds an instrument', function() {
  SparkInstruments.register({
    id: 'test_guitar', instrument: 'guitar', name: 'Guitar', icon: 'G',
    skin: SparkHighway.GUITAR_SKIN, available: true,
    getData: function() { return {}; },
    pages: { home: function() { return '<div>Guitar Home</div>'; } },
    tabs: ['practice'], stemMutePreset: {}, init: function() {}
  });
  assert.strictEqual(SparkInstruments.getAll().length, 1);
  assert.strictEqual(SparkInstruments.getAll()[0].id, 'test_guitar');
});

test('register adds a second instrument', function() {
  SparkInstruments.register({
    id: 'test_piano', instrument: 'piano', name: 'Piano', icon: 'P',
    skin: SparkHighway.PIANO_SKIN, available: true,
    getData: function() { return {}; },
    pages: { home: function() { return '<div>Piano Home</div>'; } },
    tabs: ['practice'], stemMutePreset: {}, init: function() {}
  });
  assert.strictEqual(SparkInstruments.getAll().length, 2);
});

test('activate sets active instrument', function() {
  SparkInstruments.activate('test_guitar');
  var active = SparkInstruments.getActive();
  assert.ok(active);
  assert.strictEqual(active.id, 'test_guitar');
});

test('deactivate clears active instrument', function() {
  SparkInstruments.deactivate();
  assert.strictEqual(SparkInstruments.getActive(), null);
});

test('getPage returns page from active instrument', function() {
  SparkInstruments.activate('test_guitar');
  var page = SparkInstruments.getPage('home');
  assert.ok(page);
  assert.strictEqual(typeof page, 'function');
});

test('getPage returns null for missing page', function() {
  SparkInstruments.activate('test_guitar');
  assert.strictEqual(SparkInstruments.getPage('nonexistent'), null);
});

test('getPage returns null when no active instrument', function() {
  SparkInstruments.deactivate();
  assert.strictEqual(SparkInstruments.getPage('home'), null);
});

test('launcherPage returns HTML with instrument cards', function() {
  var html = SparkInstruments.renderLauncher();
  assert.ok(html.indexOf('Guitar') >= 0);
  assert.ok(html.indexOf('Piano') >= 0);
});

// Summary
console.log('\n' + '='.repeat(40));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('='.repeat(40));
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd "C:/Users/Scott Morley/Dev/sparksuite"
node tests/test_launcher.js
```

Expected: FAIL — `SparkInstruments` not defined

- [ ] **Step 3: Create launcher.js**

```js
// js/launcher.js — SparkInstruments registry and launcher screen
(function() {

  var _instruments = [];
  var _active = null;

  var SparkInstruments = {
    register: function(config) {
      for (var i = 0; i < _instruments.length; i++) {
        if (_instruments[i].id === config.id) return;
      }
      _instruments.push(config);
    },

    activate: function(appId) {
      for (var i = 0; i < _instruments.length; i++) {
        if (_instruments[i].id === appId) {
          _active = _instruments[i];
          if (_active.init) _active.init();
          return;
        }
      }
    },

    deactivate: function() {
      _active = null;
    },

    getActive: function() {
      return _active;
    },

    getAll: function() {
      return _instruments.slice();
    },

    getPage: function(screenId) {
      if (!_active || !_active.pages) return null;
      return _active.pages[screenId] || null;
    },

    renderLauncher: function() {
      var profile = typeof SparkStorage !== "undefined" ? SparkStorage.load() : null;
      var h = '';

      // Suite header
      h += '<div style="text-align:center;padding:40px 20px 20px">';
      h += '<div style="font-size:48px;margin-bottom:8px">&#127925;</div>';
      h += '<h1 style="font-size:28px;font-weight:900;margin:0;color:var(--text-primary)">SparkSuite</h1>';

      if (profile) {
        var totalXp = 0, maxStreak = 0;
        for (var appId in profile.apps) {
          var app = profile.apps[appId];
          totalXp += (app.stats ? app.stats.xp : 0);
          var s = app.stats ? app.stats.streakDays : 0;
          if (s > maxStreak) maxStreak = s;
        }
        h += '<div style="color:var(--text-muted);font-size:14px;margin-top:6px">';
        h += '&#9889; ' + totalXp + ' XP';
        if (maxStreak > 0) h += ' &middot; &#128293; ' + maxStreak + ' day streak';
        var badgeCount = profile.suiteRewards ? profile.suiteRewards.badges.length : 0;
        if (badgeCount > 0) h += ' &middot; &#127942; ' + badgeCount + ' badges';
        h += '</div>';
      }
      h += '</div>';

      // Instrument cards
      h += '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:16px;padding:20px;max-width:500px;margin:0 auto">';

      for (var i = 0; i < _instruments.length; i++) {
        var inst = _instruments[i];
        var appStats = null;
        if (profile && profile.apps && profile.apps[inst.id]) {
          appStats = profile.apps[inst.id].stats;
        }

        if (inst.available !== false) {
          h += '<div class="card" style="flex:1;min-width:140px;max-width:200px;text-align:center;cursor:pointer;transition:transform .15s,box-shadow .15s" ';
          h += 'onclick="SparkInstruments.activate(\'' + inst.id + '\');S.activeInstrument=\'' + inst.id + '\';S.screen=SCR.HOME;S.tab=TAB.PRACTICE;saveState();render()" ';
          h += 'onmouseenter="this.style.transform=\'translateY(-4px)\';this.style.boxShadow=\'0 8px 24px rgba(0,0,0,.15)\'" ';
          h += 'onmouseleave="this.style.transform=\'none\';this.style.boxShadow=\'\'">';
          h += '<div style="font-size:48px;margin-bottom:8px">' + inst.icon + '</div>';
          h += '<div style="font-weight:800;font-size:18px;color:var(--text-primary)">' + escHTML(inst.name) + '</div>';
          if (appStats) {
            h += '<div style="color:var(--text-muted);font-size:13px;margin-top:4px">Lvl ' + (appStats.level || 1) + ' &middot; ' + (appStats.xp || 0) + ' XP</div>';
          } else {
            h += '<div style="color:var(--text-muted);font-size:13px;margin-top:4px">Start learning!</div>';
          }
          h += '</div>';
        } else {
          h += '<div class="card" style="flex:1;min-width:140px;max-width:200px;text-align:center;opacity:0.5">';
          h += '<div style="font-size:48px;margin-bottom:8px">' + inst.icon + '</div>';
          h += '<div style="font-weight:800;font-size:18px;color:var(--text-muted)">' + escHTML(inst.name) + '</div>';
          h += '<div style="color:var(--text-muted);font-size:13px;margin-top:4px">Coming Soon</div>';
          h += '</div>';
        }
      }

      h += '</div>';
      return h;
    }
  };

  window.SparkInstruments = SparkInstruments;
})();
```

- [ ] **Step 4: Run tests**

```bash
cd "C:/Users/Scott Morley/Dev/sparksuite"
node tests/test_launcher.js
```

Expected: All 9 tests PASS

- [ ] **Step 5: Add SCR.LAUNCHER to data.js**

In `js/data.js`, add `LAUNCHER:"launcher"` to the SCR object (after `ONBOARDING:"onboarding"`).

- [ ] **Step 6: Add activeInstrument to state.js**

In `js/state.js`, add `activeInstrument:null,` near the top of the S object (after the `screen` and `tab` fields).

Find the `PERSIST_FIELDS` array and add `"activeInstrument"` to it.

- [ ] **Step 7: Add launcher.js script tag to index.html**

Insert after the spark-core/performance-core scripts block and before `js/data.js`:

```html
<!-- Launcher -->
<script src="js/launcher.js"></script>
```

- [ ] **Step 8: Commit**

```bash
git add js/launcher.js tests/test_launcher.js js/data.js js/state.js index.html
git commit -m "feat: add SparkInstruments registry and launcher screen"
```

---

## Task 3: Wire Launcher into Render Pipeline

**Files:**
- Modify: `js/app.js` (render function + header)
- Modify: `index.html` (header changes)

- [ ] **Step 1: Add launcher gate to _renderInner()**

In `js/app.js`, find the `_renderInner()` function. At the beginning of the screen routing section (around line 1558, where `var screenKey=S.screen+S.tab;` is), add a launcher check BEFORE the existing screen routing:

```js
  // Launcher gate — if no instrument active, show launcher
  if (!S.activeInstrument) {
    h += SparkInstruments.renderLauncher();
    app.innerHTML = h;
    document.getElementById("header").style.display = "none";
    return;
  } else {
    document.getElementById("header").style.display = "";
  }
```

Insert this right after the `var content="";` line and before the `if(S.screen===SCR.HOME)` line.

- [ ] **Step 2: Add back-to-launcher button in header**

In `index.html`, find the header div with the logo. Add a back button before the logo:

```html
<button id="launcher-back" onclick="SparkInstruments.deactivate();S.activeInstrument=null;saveState();render()" style="background:none;font-size:18px;padding:4px 8px;display:none" aria-label="Back to launcher">&#9664;</button>
```

- [ ] **Step 3: Show/hide back button based on active instrument**

In `js/app.js`, inside `_renderInner()`, right after the launcher gate (after the `document.getElementById("header").style.display = "";` line), add:

```js
  var backBtn = document.getElementById("launcher-back");
  if (backBtn) backBtn.style.display = S.activeInstrument ? "" : "none";
```

- [ ] **Step 4: Update logo to show active instrument name**

In `_renderInner()`, after the back button logic, add:

```js
  var logoText = document.querySelector(".logo-text");
  if (logoText) {
    var inst = SparkInstruments.getActive();
    logoText.textContent = inst ? inst.name + "Spark" : "SparkSuite";
  }
```

- [ ] **Step 5: Initialize active instrument on app load**

In `js/app.js`, find the init/boot section at the bottom of the file (where `loadState()` is called). After `loadState()`, add:

```js
if (S.activeInstrument) {
  SparkInstruments.activate(S.activeInstrument);
}
```

- [ ] **Step 6: Verify launcher works**

```bash
cd "C:/Users/Scott Morley/Dev/sparksuite"
npm start
```

Expected: App opens to launcher (no instruments registered yet, so it shows empty). No console errors.

- [ ] **Step 7: Commit**

```bash
git add js/app.js index.html
git commit -m "feat: wire launcher into render pipeline with back button"
```

---

## Task 4: Register Guitar Instrument

**Files:**
- Create: `js/instruments/guitar/register.js`
- Modify: `index.html` (add script tag)

- [ ] **Step 1: Create instruments/guitar directory**

```bash
mkdir -p "C:/Users/Scott Morley/Dev/sparksuite/js/instruments/guitar"
```

- [ ] **Step 2: Create guitar registration**

```js
// js/instruments/guitar/register.js
(function() {
  SparkInstruments.register({
    id: "chordspark",
    instrument: "guitar",
    name: "Guitar",
    icon: "\uD83C\uDFB8",
    skin: typeof SparkHighway !== "undefined" ? SparkHighway.GUITAR_SKIN : null,
    available: true,

    getData: function() {
      return {
        chords: typeof GUITAR_CHORDS !== "undefined" ? GUITAR_CHORDS : {},
        sessions: typeof GUITAR_SESSIONS !== "undefined" ? GUITAR_SESSIONS : [],
        songs: typeof SONGS !== "undefined" ? SONGS : []
      };
    },

    pages: {},  // Phase 1: all guitar pages stay in app.js, no extraction needed yet

    tabs: ["practice", "drill", "songs", "guide"],

    stemMutePreset: {
      guitar: false, vocals: true, drums: true,
      bass: true, piano: true, other: true
    },

    init: function() {
      // Ensure suite profile has guitar app
      if (typeof SparkProfile !== "undefined" && typeof SparkStorage !== "undefined") {
        var profile = SparkStorage.load();
        SparkProfile.ensureApp(profile, "chordspark", "guitar");
        SparkStorage.save(profile);
      }
    }
  });
})();
```

Note: In Phase 1, we do NOT extract page renderers from app.js. The existing screen routing in `_renderInner()` continues to work for guitar. The `pages` map is empty — it will be populated in a future refactor pass. What matters now is that guitar registers, the launcher shows the card, and tapping it enters the guitar experience.

- [ ] **Step 3: Add script tag to index.html**

Insert after the launcher.js script tag and before `js/data.js`:

```html
<!-- Instrument Modules -->
<script src="js/instruments/guitar/register.js"></script>
```

- [ ] **Step 4: Verify guitar card appears in launcher**

```bash
npm start
```

Expected: Launcher shows a Guitar card with guitar emoji. Tapping it enters the full ChordSpark experience. Back button returns to launcher.

- [ ] **Step 5: Commit**

```bash
git add js/instruments/guitar/register.js index.html
git commit -m "feat: register guitar instrument with launcher"
```

---

## Task 5: Register Piano Instrument

**Files:**
- Create: `js/instruments/piano/register.js`
- Create: `js/instruments/piano/data.js`
- Create: `js/instruments/piano/pages.js`
- Modify: `index.html`

This task ports PianoSpark's unique code into the SparkSuite repo. Since the shared systems (performance, editor, analytics, etc.) are structurally identical and already exist from ChordSpark, we only need piano-specific data and page renderers.

- [ ] **Step 1: Create instruments/piano directory**

```bash
mkdir -p "C:/Users/Scott Morley/Dev/sparksuite/js/instruments/piano"
```

- [ ] **Step 2: Create piano data file**

Read `C:\Users\Scott Morley\Dev\pianospark\js\data.js` and extract the piano-specific data that differs from ChordSpark. Create `js/instruments/piano/data.js` containing:

- `PIANO_SONGS` array (PianoSpark's song list)
- `PIANO_VOICINGS` object (piano chord voicings — different from ChordSpark's `PIANO_CHORDS` which is just for dual-instrument display)
- `PIANO_EXERCISES` array (if any piano-specific exercises exist)
- Piano-specific `SCR` and `TAB` constants (only if they differ from guitar)

Wrap in IIFE and expose as globals:

```js
// js/instruments/piano/data.js
(function() {
  // Piano-specific song library
  window.PIANO_SONGS = [ /* copy from pianospark/js/data.js */ ];

  // Piano-specific voicings (full set from PianoSpark)
  window.PIANO_VOICINGS = { /* copy from pianospark/js/data.js */ };
})();
```

The exact content must be copied from `C:\Users\Scott Morley\Dev\pianospark\js\data.js`. Do not invent data — read the file and extract what's piano-specific.

- [ ] **Step 3: Create piano pages stub**

For Phase 1, the piano module provides minimal page renderers that reuse shared systems. Piano-specific pages (like left-hand pattern selection, piano-specific arrangement types) will be ported progressively.

```js
// js/instruments/piano/pages.js
(function() {
  // Piano-specific page overrides
  // Most pages reuse the shared renderers from ChordSpark
  // Piano-specific pages will be added here progressively

  window.PIANO_PAGES = {
    // Stub — the shared page renderers handle most functionality
    // Piano-specific overrides go here as they're ported
  };
})();
```

- [ ] **Step 4: Create piano registration**

```js
// js/instruments/piano/register.js
(function() {
  SparkInstruments.register({
    id: "pianospark",
    instrument: "piano",
    name: "Piano",
    icon: "\uD83C\uDFB9",
    skin: typeof SparkHighway !== "undefined" ? SparkHighway.PIANO_SKIN : null,
    available: true,

    getData: function() {
      return {
        songs: typeof PIANO_SONGS !== "undefined" ? PIANO_SONGS : [],
        voicings: typeof PIANO_VOICINGS !== "undefined" ? PIANO_VOICINGS : {}
      };
    },

    pages: typeof PIANO_PAGES !== "undefined" ? PIANO_PAGES : {},

    tabs: ["practice", "songs", "games", "tools"],

    stemMutePreset: {
      piano: false, vocals: true, drums: true,
      bass: true, guitar: true, other: true
    },

    init: function() {
      if (typeof SparkProfile !== "undefined" && typeof SparkStorage !== "undefined") {
        var profile = SparkStorage.load();
        SparkProfile.ensureApp(profile, "pianospark", "piano");
        SparkStorage.save(profile);
      }
    }
  });
})();
```

- [ ] **Step 5: Add script tags to index.html**

Insert after the guitar register.js script tag:

```html
<script src="js/instruments/piano/data.js"></script>
<script src="js/instruments/piano/pages.js"></script>
<script src="js/instruments/piano/register.js"></script>
```

- [ ] **Step 6: Verify both instruments appear in launcher**

```bash
npm start
```

Expected: Launcher shows Guitar and Piano cards. Guitar works fully. Piano card enters the app but reuses guitar pages (expected for Phase 1 — piano-specific pages come later).

- [ ] **Step 7: Commit**

```bash
git add js/instruments/piano/ index.html
git commit -m "feat: register piano instrument with launcher"
```

---

## Task 6: Copy Piano Audio Assets

**Files:**
- Copy: PianoSpark audio assets to sparksuite

- [ ] **Step 1: Copy piano sounds**

Check if PianoSpark has audio assets:

```bash
ls "C:/Users/Scott Morley/Dev/pianospark/sounds/" 2>/dev/null
ls "C:/Users/Scott Morley/Dev/pianospark/audio/" 2>/dev/null
```

Copy any piano-specific audio assets into `sparksuite/sounds/piano/` (or the equivalent path).

- [ ] **Step 2: Copy SparkGame visual assets**

PianoSpark has a `sparkgame/` directory with highway visual assets (backgrounds, gems, VFX sprites, icons). Copy these:

```bash
cp -r "C:/Users/Scott Morley/Dev/pianospark/sparkgame" "C:/Users/Scott Morley/Dev/sparksuite/sparkgame" 2>/dev/null
```

- [ ] **Step 3: Copy demucs resources if present**

```bash
cp -r "C:/Users/Scott Morley/Dev/pianospark/resources" "C:/Users/Scott Morley/Dev/sparksuite/resources" 2>/dev/null
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add piano audio assets and sparkgame visuals"
```

---

## Task 7: Add "Coming Soon" Drum Instrument

**Files:**
- Create: `js/instruments/drums/register.js`
- Modify: `index.html`

- [ ] **Step 1: Create drums directory and registration**

```bash
mkdir -p "C:/Users/Scott Morley/Dev/sparksuite/js/instruments/drums"
```

```js
// js/instruments/drums/register.js
(function() {
  SparkInstruments.register({
    id: "drumspark",
    instrument: "drums",
    name: "Drums",
    icon: "\uD83E\uDD41",
    skin: null,
    available: false,  // Coming Soon
    getData: function() { return {}; },
    pages: {},
    tabs: [],
    stemMutePreset: {},
    init: function() {}
  });
})();
```

- [ ] **Step 2: Add script tag**

Add after the piano register script tag in index.html:

```html
<script src="js/instruments/drums/register.js"></script>
```

- [ ] **Step 3: Verify three cards in launcher**

```bash
npm start
```

Expected: Guitar and Piano cards are clickable. Drums card shows as greyed-out "Coming Soon".

- [ ] **Step 4: Commit**

```bash
git add js/instruments/drums/ index.html
git commit -m "feat: add drums as coming-soon instrument"
```

---

## Task 8: Run All Tests and Final Verification

**Files:**
- Run: all test suites

- [ ] **Step 1: Run launcher tests**

```bash
cd "C:/Users/Scott Morley/Dev/sparksuite"
node tests/test_launcher.js
```

Expected: All 9 tests PASS

- [ ] **Step 2: Run spark-core tests**

```bash
node tests/test_spark_core.js
```

Expected: All 30 tests PASS

- [ ] **Step 3: Run performance-core tests**

```bash
node tests/test_performance_core.js
```

Expected: All 8 tests PASS

- [ ] **Step 4: Run existing tests**

```bash
npm test
```

Expected: All existing tests PASS

- [ ] **Step 5: End-to-end verification**

Launch the app (`npm start` or open `index.html`) and verify:
- Launcher shows Guitar, Piano, Drums cards
- Guitar card → full ChordSpark experience works
- Back button → returns to launcher
- Piano card → enters app (shared pages for now)
- Back button → returns to launcher
- Drums card → greyed out, not clickable
- Close and reopen → remembers last active instrument
- Suite stats show in launcher header

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "test: verify all suites pass and end-to-end launcher works"
```

---

## What This Plan Does NOT Cover (Future Work)

These are explicitly deferred and should be separate plans:

1. **Extracting guitar page renderers from app.js** — Currently all guitar pages live in the monolithic app.js. Moving them to `instruments/guitar/pages.js` is a large refactor that can happen incrementally.
2. **Porting piano-specific page renderers** — Piano arrangements (left-hand patterns, block chords, melody), piano-specific UI, piano exercises need to be ported from PianoSpark's app.js.
3. **Shared page router refactor** — Making the screen routing in `_renderInner()` delegate to `SparkInstruments.getPage()` instead of hardcoded if/else chains.
4. **Piano audio engine** — PianoSpark's audio.js has piano sample loading that needs to be ported.
5. **Content pack system** — Per-instrument content packs for lessons, drills, songs.
6. **Electron build configuration** — Updating electron-builder for SparkSuite branding and installer.
