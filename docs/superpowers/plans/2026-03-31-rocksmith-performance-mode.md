# Rocksmith-Inspired Performance Mode - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a scrolling chord-highway performance mode with MIDI-first scoring, phrase stats, looping, speed presets, and stem practice presets.

**Architecture:** New `js/performance/` module folder with 6 files (chart, transport, input, scoring, session, highway) plus a page file at `js/pages/perform.js`. All files are vanilla JS globals matching the existing repo style. The new mode integrates into the existing screen router, action dispatcher, and stem/MIDI subsystems via thin additive bridges.

**Tech Stack:** Vanilla JavaScript, HTML/CSS highway (no canvas), Web MIDI API, existing stem audio elements, requestAnimationFrame game loop.

---

## File Map

### New Files

| File | Responsibility |
|------|---------------|
| `js/performance/chart.js` | Load JSON chart files, normalize events, query events by time window |
| `js/performance/transport.js` | Game clock using `performance.now()`, play/pause/seek/speed |
| `js/performance/input.js` | Normalize MIDI and mic inputs into a unified snapshot |
| `js/performance/scoring.js` | Score events against snapshots, grade, combo, phrase stats |
| `js/performance/session.js` | Orchestrate startup, RAF loop, loop regions, stem presets, finish |
| `js/performance/highway.js` | Render scrolling chord highway as HTML |
| `js/pages/perform.js` | Build perform screen and results screen HTML |
| `data/performance_charts/demo_progression.json` | Demo chart with two phrases of chord events |

### Modified Files

| File | Changes |
|------|---------|
| `index.html` | Add 7 new `<script>` tags before `js/app.js` |
| `js/data.js` | Add `SCR.PERFORM` and `SCR.PERFORM_DONE` constants |
| `js/state.js` | Add perform state fields to `S` and persistence fields to `PERSIST_FIELDS` |
| `js/app.js` | Add render routes, action handlers, extend `stopAllTimers()` |
| `js/audio.js` | Add thin MIDI/mic bridge to forward events when perform mode is active |
| `js/pages/songs.js` | Add "Perform" button for demo chart entry |
| `styles.css` | Add perform page, highway, hit-line, event, and results styles |

---

## Task 1: State Fields, Constants, and Script Loading

**Files:**
- Modify: `js/data.js:2-7` (SCR object)
- Modify: `js/state.js:2-78` (S object), `js/state.js:87-92` (PERSIST_FIELDS)
- Modify: `index.html:30-42` (script tags)
- Create: `js/performance/chart.js`
- Create: `js/performance/transport.js`
- Create: `js/performance/input.js`
- Create: `js/performance/scoring.js`
- Create: `js/performance/session.js`
- Create: `js/performance/highway.js`
- Create: `js/pages/perform.js`
- Create: `data/performance_charts/demo_progression.json`

- [ ] **Step 1: Add screen constants to `js/data.js`**

In `js/data.js`, add two new screen constants to the `SCR` object. Current SCR (line 2-7):

```js
var SCR={
  HOME:"home",SESSION:"session",COMPLETE:"complete",
  DRILL:"drill",DRILL_DONE:"drillDone",DAILY:"daily",
  QUIZ:"quiz",STRUM:"strumDetail",SONG:"songDetail",
  SONG_DONE:"songDone",STEMS:"stems",GUIDED:"guided",GUIDED_DONE:"guidedDone"
};
```

Replace with:

```js
var SCR={
  HOME:"home",SESSION:"session",COMPLETE:"complete",
  DRILL:"drill",DRILL_DONE:"drillDone",DAILY:"daily",
  QUIZ:"quiz",STRUM:"strumDetail",SONG:"songDetail",
  SONG_DONE:"songDone",STEMS:"stems",GUIDED:"guided",GUIDED_DONE:"guidedDone",
  PERFORM:"perform",PERFORM_DONE:"performDone"
};
```

- [ ] **Step 2: Add perform state fields to `js/state.js`**

In the `S` object initialization (after the last existing field, before the closing `}`), add:

```js
  // Performance mode
  performMode:"midi",
  performDifficulty:"normal",
  performChartId:null,
  performChart:null,
  performPlaying:false,
  performPaused:false,
  performCurrentSec:0,
  performStartSec:0,
  performSpeed:1.0,
  performScrollSpeed:180,
  performLoop:null,
  performScore:0,
  performCombo:0,
  performMaxCombo:0,
  performAccuracy:0,
  performPhraseIdx:0,
  performResults:null,
  performStarRating:0,
  performPhraseStats:[],
  performWindowPerfectMs:70,
  performWindowGoodMs:140,
  performWindowMissMs:220,
  performInputSource:"midi",
  performInputNotes:[],
  performPracticePreset:"no_guitar",
  performAssistHints:true,
  performCountIn:true,
  performCountdownActive:false,
  performCountdownBeats:0,
  performHighwayLookaheadSec:3.0,
  performLastHitLabel:"",
  performLastHitTime:0,
  performDebug:false
```

- [ ] **Step 3: Add persistence fields to `PERSIST_FIELDS`**

In `js/state.js`, append to the `PERSIST_FIELDS` array (line ~92, before the closing `]`):

```js
  "performMode","performDifficulty","performSpeed","performPracticePreset","performAssistHints","performCountIn"
```

- [ ] **Step 4: Create empty scaffold files**

Create the `js/performance/` directory and all 6 files with header comments. Also create `data/performance_charts/` directory.

`js/performance/chart.js`:
```js
/* ===== ChordSpark Performance: Chart Loader ===== */
```

`js/performance/transport.js`:
```js
/* ===== ChordSpark Performance: Transport Clock ===== */
```

`js/performance/input.js`:
```js
/* ===== ChordSpark Performance: Input Normalization ===== */
```

`js/performance/scoring.js`:
```js
/* ===== ChordSpark Performance: Scoring Engine ===== */
```

`js/performance/session.js`:
```js
/* ===== ChordSpark Performance: Session Orchestrator ===== */
```

`js/performance/highway.js`:
```js
/* ===== ChordSpark Performance: Highway Renderer ===== */
```

`js/pages/perform.js`:
```js
/* ===== ChordSpark: Perform Page ===== */

function performPage(){ return '<div class="perform-page"><p>Performance mode loading...</p></div>'; }
function performDonePage(){ return '<div class="perform-page"><p>Results loading...</p></div>'; }
```

- [ ] **Step 5: Create demo chart JSON**

Create `data/performance_charts/demo_progression.json`:

```json
{
  "id": "demo_progression",
  "title": "Demo Progression",
  "artist": "ChordSpark",
  "bpm": 90,
  "beatsPerBar": 4,
  "offsetSec": 0,
  "audio": {
    "type": "silent"
  },
  "phrases": [
    { "id": 0, "name": "Phrase 1", "startSec": 0, "endSec": 8 },
    { "id": 1, "name": "Phrase 2", "startSec": 8, "endSec": 16 }
  ],
  "events": [
    { "id": 1, "t": 0, "dur": 2, "type": "chord", "chord": "E Minor", "notes": ["E","G","B"], "laneLabel": "Em", "strum": "down" },
    { "id": 2, "t": 2, "dur": 2, "type": "chord", "chord": "G Major", "notes": ["G","B","D"], "laneLabel": "G", "strum": "down" },
    { "id": 3, "t": 4, "dur": 2, "type": "chord", "chord": "D Major", "notes": ["D","F#","A"], "laneLabel": "D", "strum": "down" },
    { "id": 4, "t": 6, "dur": 2, "type": "chord", "chord": "A Minor", "notes": ["A","C","E"], "laneLabel": "Am", "strum": "down" },
    { "id": 5, "t": 8, "dur": 2, "type": "chord", "chord": "C Major", "notes": ["C","E","G"], "laneLabel": "C", "strum": "down" },
    { "id": 6, "t": 10, "dur": 2, "type": "chord", "chord": "G Major", "notes": ["G","B","D"], "laneLabel": "G", "strum": "down" },
    { "id": 7, "t": 12, "dur": 2, "type": "chord", "chord": "A Minor", "notes": ["A","C","E"], "laneLabel": "Am", "strum": "down" },
    { "id": 8, "t": 14, "dur": 2, "type": "chord", "chord": "E Minor", "notes": ["E","G","B"], "laneLabel": "Em", "strum": "down" }
  ]
}
```

- [ ] **Step 6: Add script tags to `index.html`**

In `index.html`, insert the new script tags **after** `js/pages/dual.js` (line 41) and **before** `js/app.js` (line 42). The final order must be:

```html
  <script src="js/pages/dual.js"></script>
  <script src="js/performance/chart.js"></script>
  <script src="js/performance/transport.js"></script>
  <script src="js/performance/input.js"></script>
  <script src="js/performance/scoring.js"></script>
  <script src="js/performance/session.js"></script>
  <script src="js/performance/highway.js"></script>
  <script src="js/pages/perform.js"></script>
  <script src="js/app.js"></script>
```

- [ ] **Step 7: Add render routes to `js/app.js`**

In `_renderInner()`, after the `GUIDED_DONE` route (line 1202), add:

```js
  else if(S.screen===SCR.PERFORM)content=performPage();
  else if(S.screen===SCR.PERFORM_DONE)content=performDonePage();
```

- [ ] **Step 8: Verify scaffold loads without errors**

Open the app in Electron (`npm start`). Open DevTools console. Verify:
- No script loading errors
- Existing screens (Practice, Songs, etc.) still work
- `SCR.PERFORM` is defined (type `SCR.PERFORM` in console, expect `"perform"`)
- `S.performMode` is defined (type `S.performMode` in console, expect `"midi"`)

- [ ] **Step 9: Commit**

```bash
git add js/performance/ js/pages/perform.js data/performance_charts/ js/data.js js/state.js js/app.js index.html
git commit -m "feat(perform): scaffold state fields, screen constants, file structure, demo chart"
```

---

## Task 2: Chart Loader and Transport Clock

**Files:**
- Modify: `js/performance/chart.js`
- Modify: `js/performance/transport.js`

- [ ] **Step 1: Implement chart.js**

Replace the contents of `js/performance/chart.js` with:

```js
/* ===== ChordSpark Performance: Chart Loader ===== */

function loadPerformanceChart(chartId) {
  return fetch("data/performance_charts/" + chartId + ".json")
    .then(function(r) {
      if (!r.ok) throw new Error("Chart not found: " + chartId);
      return r.json();
    })
    .then(function(chart) {
      return normalizePerformanceChart(chart);
    });
}

function normalizePerformanceChart(chart) {
  if (!chart.phrases) chart.phrases = [];
  if (!chart.events) chart.events = [];
  // Sort events by time
  chart.events.sort(function(a, b) { return a.t - b.t; });
  // Assign phraseId and runtime flags to each event
  for (var i = 0; i < chart.events.length; i++) {
    var evt = chart.events[i];
    evt.phraseId = _findPhraseIdForTime(chart, evt.t);
    evt._hit = false;
    evt._miss = false;
    evt._scored = false;
    evt._result = null;
    evt._score = 0;
  }
  return chart;
}

function _findPhraseIdForTime(chart, sec) {
  for (var i = 0; i < chart.phrases.length; i++) {
    var p = chart.phrases[i];
    if (sec >= p.startSec && sec < p.endSec) return p.id;
  }
  return chart.phrases.length > 0 ? chart.phrases[chart.phrases.length - 1].id : 0;
}

function getPerformanceEventsInWindow(chart, fromSec, toSec) {
  var result = [];
  for (var i = 0; i < chart.events.length; i++) {
    var evt = chart.events[i];
    // Event is in window if it starts before toSec and ends after fromSec
    var evtEnd = evt.t + (evt.dur || 0);
    if (evt.t < toSec && evtEnd > fromSec) result.push(evt);
  }
  return result;
}

function getPerformancePhraseForTime(chart, sec) {
  for (var i = 0; i < chart.phrases.length; i++) {
    var p = chart.phrases[i];
    if (sec >= p.startSec && sec < p.endSec) return p;
  }
  return chart.phrases[chart.phrases.length - 1] || null;
}

function getPerformancePhraseIndexForTime(chart, sec) {
  for (var i = 0; i < chart.phrases.length; i++) {
    var p = chart.phrases[i];
    if (sec >= p.startSec && sec < p.endSec) return i;
  }
  return chart.phrases.length - 1;
}

function clonePerformanceChart(chart) {
  return normalizePerformanceChart(JSON.parse(JSON.stringify(chart)));
}
```

- [ ] **Step 2: Implement transport.js**

Replace the contents of `js/performance/transport.js` with:

```js
/* ===== ChordSpark Performance: Transport Clock ===== */

var PerformanceTransport = {
  _playing: false,
  _startedPerfMs: 0,
  _offsetSec: 0,
  _speed: 1,
  _pausedSec: 0,

  start: function(fromSec, speed) {
    this._offsetSec = fromSec || 0;
    this._speed = speed || 1;
    this._startedPerfMs = performance.now();
    this._playing = true;
    this._pausedSec = 0;
  },

  pause: function() {
    if (!this._playing) return;
    this._pausedSec = this.now();
    this._playing = false;
  },

  resume: function() {
    if (this._playing) return;
    this._offsetSec = this._pausedSec;
    this._startedPerfMs = performance.now();
    this._playing = true;
  },

  stop: function() {
    this._playing = false;
    this._pausedSec = 0;
    this._offsetSec = 0;
  },

  seek: function(sec) {
    this._offsetSec = sec;
    this._startedPerfMs = performance.now();
    if (!this._playing) this._pausedSec = sec;
  },

  setSpeed: function(speed) {
    if (this._playing) {
      // Preserve current position when changing speed
      var cur = this.now();
      this._offsetSec = cur;
      this._startedPerfMs = performance.now();
    }
    this._speed = speed;
  },

  now: function() {
    if (!this._playing) return this._pausedSec;
    var elapsedMs = performance.now() - this._startedPerfMs;
    return this._offsetSec + (elapsedMs / 1000) * this._speed;
  },

  isPlaying: function() {
    return this._playing;
  }
};
```

- [ ] **Step 3: Verify chart loads in console**

Open DevTools console and run:

```js
loadPerformanceChart("demo_progression").then(function(c){ console.log("Loaded:", c.title, c.events.length, "events"); window._testChart = c; })
```

Expected: `Loaded: Demo Progression 8 events`

Then test:
```js
getPerformanceEventsInWindow(_testChart, 0, 4).length // expect 2
getPerformancePhraseForTime(_testChart, 5).name // expect "Phrase 1"
```

- [ ] **Step 4: Verify transport in console**

```js
PerformanceTransport.start(0, 1); setTimeout(function(){ console.log("After 1s:", PerformanceTransport.now().toFixed(2)); PerformanceTransport.stop(); }, 1000);
```

Expected: `After 1s: ~1.00` (approximately 1.0 seconds)

- [ ] **Step 5: Commit**

```bash
git add js/performance/chart.js js/performance/transport.js
git commit -m "feat(perform): implement chart loader and transport clock"
```

---

## Task 3: Highway Renderer and Perform Page

**Files:**
- Modify: `js/performance/highway.js`
- Modify: `js/pages/perform.js`
- Modify: `styles.css`

- [ ] **Step 1: Implement highway.js**

Replace `js/performance/highway.js` with:

```js
/* ===== ChordSpark Performance: Highway Renderer ===== */

var HIGHWAY_HEIGHT = 400; // px total highway height
var HITLINE_Y = 340;      // px from top where the hit line sits

function performanceEventY(evtTime, nowSec, scrollSpeed) {
  // Events scroll from top (future) toward hit line (now)
  // At evtTime === nowSec, Y === HITLINE_Y
  // Earlier events (past) are below hit line
  var deltaSec = evtTime - nowSec;
  return HITLINE_Y - (deltaSec * scrollSpeed);
}

function renderPerformanceEvent(evt, nowSec, scrollSpeed, lookaheadSec) {
  var y = performanceEventY(evt.t, nowSec, scrollSpeed);
  var endY = performanceEventY(evt.t + (evt.dur || 0), nowSec, scrollSpeed);
  var height = Math.max(8, y - endY); // sustain tail height

  // Skip events that are off-screen
  if (y < -60 || endY > HIGHWAY_HEIGHT + 60) return "";

  var cls = "perform-event";
  if (evt._hit) cls += " hit";
  else if (evt._miss) cls += " miss";

  var gradeLabel = "";
  if (evt._result) {
    gradeLabel = '<span class="perform-grade perform-grade-' + evt._result.grade + '">' + evt._result.grade + '</span>';
  }

  return '<div class="' + cls + '" style="top:' + endY + 'px;height:' + height + 'px">' +
    '<span class="perform-event-label">' + escHTML(evt.laneLabel || "") + '</span>' +
    gradeLabel +
    '</div>';
}

function renderPerformancePhraseBanner(chart, nowSec) {
  var phrase = getPerformancePhraseForTime(chart, nowSec);
  if (!phrase) return "";
  return '<div class="perform-phrase-banner">' + escHTML(phrase.name) + '</div>';
}

function renderPerformanceHighway(chart, nowSec) {
  var scrollSpeed = S.performScrollSpeed;
  var lookahead = S.performHighwayLookaheadSec;
  var events = getPerformanceEventsInWindow(chart, nowSec - 1, nowSec + lookahead);

  var h = '<div class="perform-highway" style="height:' + HIGHWAY_HEIGHT + 'px">';
  // Hit line
  h += '<div class="perform-hitline" style="top:' + HITLINE_Y + 'px"></div>';
  // Events
  for (var i = 0; i < events.length; i++) {
    h += renderPerformanceEvent(events[i], nowSec, scrollSpeed, lookahead);
  }
  // Phrase banner
  h += renderPerformancePhraseBanner(chart, nowSec);
  h += '</div>';
  return h;
}
```

- [ ] **Step 2: Implement perform.js**

Replace `js/pages/perform.js` with:

```js
/* ===== ChordSpark: Perform Page ===== */

function performPage() {
  var chart = S.performChart;
  if (!chart) return '<div class="perform-page text-center"><p>No chart loaded.</p><button class="btn" onclick="act(\'back\')">Back</button></div>';

  var nowSec = S.performCurrentSec;
  var phrase = getPerformancePhraseForTime(chart, nowSec);
  var phraseName = phrase ? phrase.name : "";

  var h = '<div class="perform-page">';

  // Header bar
  h += '<div class="perform-header">';
  h += '<button class="back-btn" onclick="act(\'stopPerform\')">&larr; Exit</button>';
  h += '<div class="perform-title">';
  h += '<strong>' + escHTML(chart.title) + '</strong>';
  h += '<span class="perform-artist">' + escHTML(chart.artist || "") + '</span>';
  h += '</div>';
  h += '<div class="perform-phrase-name">' + escHTML(phraseName) + '</div>';
  h += '</div>';

  // Score strip
  h += '<div class="perform-score-strip">';
  h += '<div class="perform-stat"><span class="perform-stat-val">' + S.performScore + '</span><span class="perform-stat-label">Score</span></div>';
  h += '<div class="perform-stat"><span class="perform-stat-val">' + S.performAccuracy + '%</span><span class="perform-stat-label">Accuracy</span></div>';
  h += '<div class="perform-stat"><span class="perform-stat-val">' + S.performCombo + 'x</span><span class="perform-stat-label">Combo</span></div>';
  h += '</div>';

  // Hit feedback
  if (S.performLastHitLabel && Date.now() - S.performLastHitTime < 800) {
    h += '<div class="perform-hit-feedback">' + escHTML(S.performLastHitLabel) + '</div>';
  }

  // Highway
  h += renderPerformanceHighway(chart, nowSec);

  // Input source badge
  h += '<div class="perform-input-badge">' + (S.performInputSource === "midi" ? "MIDI" : "MIC") + '</div>';

  // Controls
  h += '<div class="perform-controls">';

  // Pause/Resume
  if (S.performPaused) {
    h += '<button class="btn perform-ctrl-btn" onclick="act(\'resumePerform\')" style="background:#4ECDC4;color:#fff">&#9654; Resume</button>';
  } else {
    h += '<button class="btn perform-ctrl-btn" onclick="act(\'pausePerform\')" style="background:#FFE66D;color:#333">&#9208; Pause</button>';
  }

  // Mode toggle
  h += '<div class="perform-toggle-group"><span class="perform-toggle-label">Input</span>';
  h += '<button class="btn btn-sm' + (S.performMode === "midi" ? " active" : "") + '" onclick="act(\'performMode\',\'midi\')">MIDI</button>';
  h += '<button class="btn btn-sm' + (S.performMode === "mic" ? " active" : "") + '" onclick="act(\'performMode\',\'mic\')">Mic</button>';
  h += '</div>';

  // Difficulty toggle
  h += '<div class="perform-toggle-group"><span class="perform-toggle-label">Difficulty</span>';
  var diffs = ["easy", "normal", "pro"];
  for (var d = 0; d < diffs.length; d++) {
    h += '<button class="btn btn-sm' + (S.performDifficulty === diffs[d] ? " active" : "") + '" onclick="act(\'performDifficulty\',\'' + diffs[d] + '\')">' + diffs[d].charAt(0).toUpperCase() + diffs[d].slice(1) + '</button>';
  }
  h += '</div>';

  // Speed toggle
  h += '<div class="perform-toggle-group"><span class="perform-toggle-label">Speed</span>';
  var speeds = [0.5, 0.75, 1.0];
  for (var sp = 0; sp < speeds.length; sp++) {
    h += '<button class="btn btn-sm' + (S.performSpeed === speeds[sp] ? " active" : "") + '" onclick="act(\'performSpeed\',' + speeds[sp] + ')">' + Math.round(speeds[sp] * 100) + '%</button>';
  }
  h += '</div>';

  // Practice presets
  h += '<div class="perform-toggle-group"><span class="perform-toggle-label">Mix</span>';
  var presets = [
    { id: "full_mix", label: "Full" },
    { id: "no_guitar", label: "No Guitar" },
    { id: "guitar_quiet", label: "Quiet Guitar" },
    { id: "guitar_solo", label: "Solo Guitar" }
  ];
  for (var pr = 0; pr < presets.length; pr++) {
    h += '<button class="btn btn-sm' + (S.performPracticePreset === presets[pr].id ? " active" : "") + '" onclick="act(\'performPracticePreset\',\'' + presets[pr].id + '\')">' + presets[pr].label + '</button>';
  }
  h += '</div>';

  // Loop phrase
  if (S.performLoop) {
    h += '<button class="btn btn-sm perform-ctrl-btn" onclick="act(\'performClearLoop\')" style="background:#FF6B6B;color:#fff">&#128260; Clear Loop</button>';
  } else {
    h += '<button class="btn btn-sm perform-ctrl-btn" onclick="act(\'performLoopPhrase\')" style="background:#4ECDC4;color:#fff">&#128257; Loop Phrase</button>';
  }

  h += '</div>'; // .perform-controls
  h += '</div>'; // .perform-page
  return h;
}

function performDonePage() {
  var r = S.performResults;
  if (!r) return '<div class="perform-page text-center"><p>No results.</p><button class="btn" onclick="act(\'back\')">Back</button></div>';

  var h = '<div class="perform-page text-center" style="padding-top:20px">';
  h += '<div style="font-size:56px;animation:bn .6s ease">&#127928;</div>';
  h += '<h2 style="font-size:26px;font-weight:900;color:var(--text-primary)">Performance Complete!</h2>';
  h += '<p style="color:var(--text-dim)">' + escHTML(r.title || "") + ' by ' + escHTML(r.artist || "") + '</p>';

  // Stars
  h += '<div style="font-size:32px;margin:12px 0">';
  for (var s = 0; s < 5; s++) {
    h += s < r.stars ? '&#11088;' : '&#9734;';
  }
  h += '</div>';

  // Stats cards
  h += '<div class="card mb20"><div style="display:flex;justify-content:space-around;text-align:center;flex-wrap:wrap">';
  h += '<div><div style="font-size:28px;font-weight:900;color:#FFE66D">' + r.score + '</div><div style="font-size:11px;color:var(--text-muted)">Score</div></div>';
  h += '<div><div style="font-size:28px;font-weight:900;color:#4ECDC4">' + r.accuracy + '%</div><div style="font-size:11px;color:var(--text-muted)">Accuracy</div></div>';
  h += '<div><div style="font-size:28px;font-weight:900;color:#FF6B6B">' + r.maxCombo + 'x</div><div style="font-size:11px;color:var(--text-muted)">Max Combo</div></div>';
  h += '</div></div>';

  // Phrase breakdown
  if (r.phraseStats && r.phraseStats.length > 0) {
    h += '<div class="card mb20" style="text-align:left"><h3 style="font-size:14px;font-weight:800;margin:0 0 10px;color:var(--text-primary)">Phrase Breakdown</h3>';
    for (var pi = 0; pi < r.phraseStats.length; pi++) {
      var ps = r.phraseStats[pi];
      var pct = ps.total > 0 ? Math.round(ps.scoreSum / ps.total * 100) : 0;
      h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border)">';
      h += '<span style="font-size:13px;font-weight:700;color:var(--text-primary)">' + escHTML(ps.name || "Phrase " + (pi + 1)) + '</span>';
      h += '<span style="font-size:12px;color:var(--text-muted)">' + ps.perfects + 'P / ' + ps.goods + 'G / ' + ps.oks + 'O / ' + ps.misses + 'M &mdash; ' + pct + '%</span>';
      h += '</div>';
    }
    h += '</div>';
  }

  // Buttons
  h += '<div class="flex-col">';
  h += '<button class="btn" onclick="act(\'performRetry\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">&#128257; Retry</button>';
  h += '<button class="btn" onclick="act(\'tab\',\'songs\')" style="background:#4ECDC4;color:#fff">&#127968; Songs</button>';
  h += '</div>';
  h += '</div>';
  return h;
}
```

- [ ] **Step 3: Add performance styles to `styles.css`**

Append the following to the end of `styles.css` (before the responsive breakpoints section):

```css
/* ===== Performance Mode ===== */
.perform-page { display:flex; flex-direction:column; height:100%; min-height:0; }
.perform-header { display:flex; align-items:center; gap:10px; padding:8px 12px; background:var(--card-bg); border-bottom:1px solid var(--border); flex-shrink:0; }
.perform-title { flex:1; }
.perform-title strong { font-size:15px; color:var(--text-primary); display:block; }
.perform-artist { font-size:11px; color:var(--text-muted); }
.perform-phrase-name { font-size:12px; font-weight:700; color:#4ECDC4; background:#4ECDC422; padding:4px 12px; border-radius:10px; }

.perform-score-strip { display:flex; justify-content:space-around; padding:8px 12px; background:var(--card-bg); border-bottom:1px solid var(--border); flex-shrink:0; }
.perform-stat { text-align:center; }
.perform-stat-val { font-size:18px; font-weight:900; color:var(--text-primary); display:block; }
.perform-stat-label { font-size:10px; color:var(--text-muted); }

.perform-hit-feedback { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:24px; font-weight:900; color:#FFE66D; text-shadow:0 2px 8px rgba(0,0,0,.5); z-index:10; animation:bn .4s ease; pointer-events:none; }

.perform-highway { position:relative; flex:1; min-height:300px; overflow:hidden; background:linear-gradient(180deg, rgba(0,0,0,.15) 0%, transparent 30%, transparent 70%, rgba(0,0,0,.15) 100%); border-left:2px solid var(--border); border-right:2px solid var(--border); }

.perform-hitline { position:absolute; left:0; right:0; height:3px; background:linear-gradient(90deg, transparent, #FF6B6B, #FF6B6B, transparent); z-index:5; box-shadow:0 0 12px rgba(255,107,107,.5); }

.perform-event { position:absolute; left:15%; right:15%; background:linear-gradient(135deg, #4ECDC4, #45B7D1); border-radius:8px; display:flex; align-items:center; justify-content:center; gap:6px; transition:background .15s; border:2px solid rgba(255,255,255,.15); }
.perform-event.hit { background:linear-gradient(135deg, #4ECDC4, #96CEB4); border-color:#4ECDC4; opacity:.6; }
.perform-event.miss { background:linear-gradient(135deg, #FF6B6B, #FF8A5C); border-color:#FF6B6B; opacity:.5; }

.perform-event-label { font-size:14px; font-weight:800; color:#fff; text-shadow:0 1px 3px rgba(0,0,0,.3); }

.perform-grade { font-size:10px; font-weight:700; padding:2px 6px; border-radius:6px; }
.perform-grade-perfect { background:#FFE66D; color:#333; }
.perform-grade-good { background:#4ECDC4; color:#fff; }
.perform-grade-ok { background:#45B7D1; color:#fff; }
.perform-grade-miss { background:#FF6B6B; color:#fff; }

.perform-phrase-banner { position:absolute; top:8px; left:50%; transform:translateX(-50%); font-size:11px; font-weight:700; color:var(--text-muted); background:var(--card-bg); padding:3px 12px; border-radius:8px; z-index:5; }

.perform-input-badge { text-align:center; font-size:11px; font-weight:700; color:var(--text-muted); padding:4px; }

.perform-controls { display:flex; flex-wrap:wrap; gap:8px; padding:10px 12px; background:var(--card-bg); border-top:1px solid var(--border); align-items:center; justify-content:center; flex-shrink:0; }
.perform-ctrl-btn { font-size:13px; padding:8px 16px; }
.perform-toggle-group { display:flex; align-items:center; gap:4px; }
.perform-toggle-label { font-size:10px; font-weight:700; color:var(--text-muted); margin-right:2px; }
.perform-toggle-group .btn-sm { font-size:11px; padding:4px 8px; border-radius:8px; background:var(--input-bg); color:var(--text-secondary); border:1px solid var(--border); }
.perform-toggle-group .btn-sm.active { background:linear-gradient(135deg,#4ECDC4,#45B7D1); color:#fff; border-color:#4ECDC4; }
```

- [ ] **Step 4: Verify highway renders statically**

Open DevTools console and run:

```js
loadPerformanceChart("demo_progression").then(function(c){ S.performChart=c; S.performCurrentSec=2; S.screen=SCR.PERFORM; render(); })
```

Verify: The perform page renders with a header, score strip, highway with chord blocks, hit line, and control buttons. No console errors.

- [ ] **Step 5: Commit**

```bash
git add js/performance/highway.js js/pages/perform.js styles.css
git commit -m "feat(perform): implement highway renderer, perform page, and results page"
```

---

## Task 4: Input Normalization and Audio Bridges

**Files:**
- Modify: `js/performance/input.js`
- Modify: `js/audio.js`

- [ ] **Step 1: Implement input.js**

Replace `js/performance/input.js` with:

```js
/* ===== ChordSpark Performance: Input Normalization ===== */

var PerformanceInput = {
  heldMidiNotes: {},
  recentMidiNoteOns: [],
  recentMicNotes: [],
  latestPitchClasses: [],
  activeMode: "midi",
  _recentBufferSec: 1.5,

  start: function(mode) {
    this.activeMode = mode || "midi";
    this.reset();
  },

  stop: function() {
    this.reset();
  },

  reset: function() {
    this.heldMidiNotes = {};
    this.recentMidiNoteOns = [];
    this.recentMicNotes = [];
    this.latestPitchClasses = [];
  },

  onMidiMessage: function(event) {
    if (!event || !event.data || event.data.length < 3) return;
    var cmd = event.data[0] & 0xf0;
    var note = event.data[1];
    var vel = event.data[2];
    var nowSec = PerformanceTransport.now();

    if (cmd === 0x90 && vel > 0) {
      // Note On
      this.heldMidiNotes[note] = true;
      this.recentMidiNoteOns.push({ note: note, tSec: nowSec });
      // Trim old attacks
      var cutoff = nowSec - this._recentBufferSec;
      while (this.recentMidiNoteOns.length > 0 && this.recentMidiNoteOns[0].tSec < cutoff) {
        this.recentMidiNoteOns.shift();
      }
      this._updatePitchClasses();
    } else if (cmd === 0x80 || (cmd === 0x90 && vel === 0)) {
      // Note Off
      delete this.heldMidiNotes[note];
      this._updatePitchClasses();
    }
  },

  onMicUpdate: function(notes) {
    // notes: array of note name strings from chord detection, e.g. ["E","G","B"]
    if (!notes || !Array.isArray(notes)) {
      this.recentMicNotes = [];
      this.latestPitchClasses = [];
      return;
    }
    this.recentMicNotes = notes.slice();
    this.latestPitchClasses = _dedupePitchClasses(notes);
  },

  getSnapshot: function(nowSec) {
    if (this.activeMode === "midi") {
      return {
        mode: "midi",
        pitchClasses: this.latestPitchClasses.slice(),
        heldMidiNotes: Object.keys(this.heldMidiNotes).map(Number),
        recentAttacks: this.recentMidiNoteOns.slice()
      };
    }
    return {
      mode: "mic",
      pitchClasses: this.latestPitchClasses.slice(),
      heldMidiNotes: [],
      recentAttacks: []
    };
  },

  getLatestPitchClasses: function() {
    return this.latestPitchClasses.slice();
  },

  getRecentAttacks: function(nowSec, windowMs) {
    var cutoff = nowSec - (windowMs / 1000);
    return this.recentMidiNoteOns.filter(function(a) { return a.tSec >= cutoff; });
  },

  _updatePitchClasses: function() {
    var held = Object.keys(this.heldMidiNotes).map(Number);
    var names = [];
    for (var i = 0; i < held.length; i++) {
      names.push(NOTE_NAMES[held[i] % 12]);
    }
    this.latestPitchClasses = _dedupePitchClasses(names);
  }
};

function _dedupePitchClasses(arr) {
  var seen = {};
  var result = [];
  for (var i = 0; i < arr.length; i++) {
    var n = arr[i];
    if (!seen[n]) { seen[n] = true; result.push(n); }
  }
  return result;
}
```

- [ ] **Step 2: Add MIDI bridge to `js/audio.js`**

In `js/audio.js`, find the `_handleMIDIMessage` function. Add a performance mode bridge at the top of the function body, right after `var cmd=event.data[0]&0xf0,note=event.data[1],vel=event.data[2];`:

```js
  // Forward to performance input when perform mode is active
  if(S.screen===SCR.PERFORM&&typeof PerformanceInput!=="undefined"){
    PerformanceInput.onMidiMessage(event);
  }
```

Then find the `_processMIDIChord()` function. After the line that updates `S.detectedNotes` (the line that sets `S.detectedNotes=uniqueNotes;` or similar), add:

```js
  // Forward detected notes to performance input when in mic mode
  if(S.screen===SCR.PERFORM&&S.performMode==="mic"&&typeof PerformanceInput!=="undefined"){
    PerformanceInput.onMicUpdate(uniqueNotes);
  }
```

Also find the `detectFromFFT` or chord detection callback where `S.detectedNotes` gets updated from microphone input (in the chord detection flow). After `S.detectedNotes` is set, add the same bridge:

```js
  if(S.screen===SCR.PERFORM&&S.performMode==="mic"&&typeof PerformanceInput!=="undefined"){
    PerformanceInput.onMicUpdate(S.detectedNotes);
  }
```

**Important:** These are additive-only changes. Do not restructure or rename existing MIDI/detection code.

- [ ] **Step 3: Verify input bridge in console**

With the app running and MIDI connected, open a perform screen:
```js
loadPerformanceChart("demo_progression").then(function(c){ S.performChart=c; S.screen=SCR.PERFORM; render(); })
```

Play a chord on the MIDI guitar. Then check:
```js
PerformanceInput.getLatestPitchClasses() // should show pitch classes
PerformanceInput.recentMidiNoteOns.length // should be > 0
```

If no MIDI device: verify no errors appear in console, and `PerformanceInput.getSnapshot(0)` returns a valid empty snapshot.

- [ ] **Step 4: Commit**

```bash
git add js/performance/input.js js/audio.js
git commit -m "feat(perform): implement input normalization and MIDI/mic bridges"
```

---

## Task 5: Scoring Engine

**Files:**
- Modify: `js/performance/scoring.js`

- [ ] **Step 1: Implement scoring.js**

Replace `js/performance/scoring.js` with:

```js
/* ===== ChordSpark Performance: Scoring Engine ===== */

function scorePerformanceEvent(event, snapshot, hitDeltaMs, difficulty, mode) {
  var targetNotes = event.notes || [];
  var inputNotes = snapshot.pitchClasses || [];

  if (targetNotes.length === 0) return { score: 0, grade: "miss", noteScore: 0, timingScore: 0 };

  // Note overlap score
  var overlap = 0;
  for (var i = 0; i < targetNotes.length; i++) {
    if (inputNotes.indexOf(targetNotes[i]) >= 0) overlap++;
  }
  var noteScore = overlap / targetNotes.length;

  // Timing score based on windows
  var absDelta = Math.abs(hitDeltaMs);
  var timingScore = 0;
  if (absDelta <= S.performWindowPerfectMs) timingScore = 1.0;
  else if (absDelta <= S.performWindowGoodMs) timingScore = 0.7;
  else if (absDelta <= S.performWindowMissMs) timingScore = 0.3;
  else timingScore = 0;

  // Blend based on difficulty
  var total;
  if (difficulty === "easy") total = noteScore * 0.85 + timingScore * 0.15;
  else if (difficulty === "pro") total = noteScore * 0.65 + timingScore * 0.35;
  else total = noteScore * 0.75 + timingScore * 0.25; // normal

  return {
    score: Math.round(total * 100) / 100,
    grade: gradePerformanceScore(total),
    noteScore: noteScore,
    timingScore: timingScore
  };
}

function gradePerformanceScore(score) {
  if (score >= 0.9) return "perfect";
  if (score >= 0.7) return "good";
  if (score >= 0.45) return "ok";
  return "miss";
}

function createEmptyPhraseStats(chart) {
  var stats = [];
  for (var i = 0; i < chart.phrases.length; i++) {
    var p = chart.phrases[i];
    stats.push({
      phraseId: p.id,
      name: p.name,
      hits: 0,
      misses: 0,
      perfects: 0,
      goods: 0,
      oks: 0,
      total: 0,
      scoreSum: 0,
      maxCombo: 0,
      _currentCombo: 0
    });
  }
  return stats;
}

function updatePhraseStats(phraseStats, event, result) {
  var pIdx = -1;
  for (var i = 0; i < phraseStats.length; i++) {
    if (phraseStats[i].phraseId === event.phraseId) { pIdx = i; break; }
  }
  if (pIdx < 0) return;

  var ps = phraseStats[pIdx];
  ps.total++;
  ps.scoreSum += result.score;

  if (result.grade === "miss") {
    ps.misses++;
    ps._currentCombo = 0;
  } else {
    ps.hits++;
    ps._currentCombo++;
    if (ps._currentCombo > ps.maxCombo) ps.maxCombo = ps._currentCombo;
    if (result.grade === "perfect") ps.perfects++;
    else if (result.grade === "good") ps.goods++;
    else if (result.grade === "ok") ps.oks++;
  }
}

function finalizePerformanceResults(chart, phraseStats) {
  var totalEvents = chart.events.length;
  var totalScore = 0;
  var totalHits = 0;
  var maxCombo = 0;

  for (var i = 0; i < phraseStats.length; i++) {
    var ps = phraseStats[i];
    totalScore += ps.scoreSum;
    totalHits += ps.hits;
    if (ps.maxCombo > maxCombo) maxCombo = ps.maxCombo;
  }

  var accuracy = totalEvents > 0 ? Math.round((totalHits / totalEvents) * 100) : 0;
  var avgScore = totalEvents > 0 ? totalScore / totalEvents : 0;

  // Star rating: 0-5
  var stars = 0;
  if (avgScore >= 0.95) stars = 5;
  else if (avgScore >= 0.85) stars = 4;
  else if (avgScore >= 0.7) stars = 3;
  else if (avgScore >= 0.5) stars = 2;
  else if (avgScore >= 0.3) stars = 1;

  return {
    title: chart.title,
    artist: chart.artist,
    score: Math.round(totalScore * 100),
    accuracy: accuracy,
    maxCombo: maxCombo,
    stars: stars,
    phraseStats: phraseStats,
    totalEvents: totalEvents
  };
}
```

- [ ] **Step 2: Verify scoring in console**

```js
var testEvt = { notes: ["E","G","B"] };
var testSnap = { pitchClasses: ["E","G","B"] };
scorePerformanceEvent(testEvt, testSnap, 30, "normal", "midi");
// expect: { score: ~0.96, grade: "perfect", noteScore: 1, timingScore: 1 }

var testSnap2 = { pitchClasses: ["E","G"] };
scorePerformanceEvent(testEvt, testSnap2, 100, "normal", "midi");
// expect: { score: ~0.67, grade: "ok", noteScore: 0.667, timingScore: 0.7 }
```

- [ ] **Step 3: Commit**

```bash
git add js/performance/scoring.js
git commit -m "feat(perform): implement scoring engine with difficulty-weighted blending"
```

---

## Task 6: Session Orchestrator

**Files:**
- Modify: `js/performance/session.js`
- Modify: `js/app.js`

- [ ] **Step 1: Implement session.js**

Replace `js/performance/session.js` with:

```js
/* ===== ChordSpark Performance: Session Orchestrator ===== */

var _performRAF = null;

function startPerformance(chartId, opts) {
  opts = opts || {};
  // Stop any conflicting playback
  stopAllTimers();

  loadPerformanceChart(chartId).then(function(chart) {
    S.performChart = chart;
    S.performChartId = chartId;
    S.performPlaying = true;
    S.performPaused = false;
    S.performCurrentSec = 0;
    S.performStartSec = 0;
    S.performScore = 0;
    S.performCombo = 0;
    S.performMaxCombo = 0;
    S.performAccuracy = 0;
    S.performPhraseIdx = 0;
    S.performResults = null;
    S.performStarRating = 0;
    S.performLoop = null;
    S.performLastHitLabel = "";
    S.performLastHitTime = 0;
    S.performPhraseStats = createEmptyPhraseStats(chart);

    if (opts.mode) S.performMode = opts.mode;
    if (opts.difficulty) S.performDifficulty = opts.difficulty;
    if (opts.speed) S.performSpeed = opts.speed;
    if (opts.preset) S.performPracticePreset = opts.preset;

    S.performInputSource = S.performMode;

    // Start input layer
    PerformanceInput.start(S.performMode);

    // Apply stem preset
    applyPerformanceStemPreset(S.performPracticePreset);

    // Start transport
    PerformanceTransport.start(0, S.performSpeed);

    // Set screen
    S.screen = SCR.PERFORM;
    render();

    // Start RAF loop
    _performRAF = requestAnimationFrame(updatePerformanceFrame);
  }).catch(function(err) {
    console.error("ChordSpark: Failed to start performance:", err);
    S.screen = SCR.HOME;
    S.tab = TAB.SONGS;
    render();
  });
}

function stopPerformance() {
  PerformanceTransport.stop();
  PerformanceInput.stop();
  S.performPlaying = false;
  S.performPaused = false;
  if (_performRAF) { cancelAnimationFrame(_performRAF); _performRAF = null; }
}

function pausePerformance() {
  PerformanceTransport.pause();
  S.performPaused = true;
  S.performPlaying = false;
  if (_performRAF) { cancelAnimationFrame(_performRAF); _performRAF = null; }
  render();
}

function resumePerformance() {
  PerformanceTransport.resume();
  S.performPaused = false;
  S.performPlaying = true;
  _performRAF = requestAnimationFrame(updatePerformanceFrame);
  render();
}

function seekPerformance(sec) {
  PerformanceTransport.seek(sec);
  S.performCurrentSec = sec;
  render();
}

function setPerformanceLoop(loopObj) {
  S.performLoop = loopObj;
  render();
}

function clearPerformanceLoop() {
  S.performLoop = null;
  render();
}

function updatePerformanceFrame() {
  if (!S.performPlaying || S.performPaused) return;

  var nowSec = PerformanceTransport.now();
  S.performCurrentSec = nowSec;
  S.performPhraseIdx = getPerformancePhraseIndexForTime(S.performChart, nowSec);

  // Score pending events
  maybeScorePendingEvents(nowSec);

  // Loop enforcement
  if (S.performLoop && nowSec >= S.performLoop.endSec) {
    PerformanceTransport.seek(S.performLoop.startSec);
    // Reset event flags for events in the loop range only
    var events = S.performChart.events;
    for (var i = 0; i < events.length; i++) {
      var e = events[i];
      if (e.t >= S.performLoop.startSec && e.t < S.performLoop.endSec) {
        e._hit = false;
        e._miss = false;
        e._scored = false;
        e._result = null;
        e._score = 0;
      }
    }
    render();
    _performRAF = requestAnimationFrame(updatePerformanceFrame);
    return;
  }

  // Check if we've passed the end of the chart
  var lastPhrase = S.performChart.phrases[S.performChart.phrases.length - 1];
  if (lastPhrase && nowSec > lastPhrase.endSec + 1) {
    finishPerformance();
    return;
  }

  render();
  _performRAF = requestAnimationFrame(updatePerformanceFrame);
}

function maybeScorePendingEvents(nowSec) {
  var chart = S.performChart;
  if (!chart) return;
  var snapshot = PerformanceInput.getSnapshot(nowSec);
  var missWindowSec = S.performWindowMissMs / 1000;

  for (var i = 0; i < chart.events.length; i++) {
    var evt = chart.events[i];
    if (evt._scored) continue;

    var deltaMs = (nowSec - evt.t) * 1000;

    // Not yet in scoring range
    if (deltaMs < -S.performWindowMissMs) continue;

    // Past miss window — mark as miss
    if (deltaMs > S.performWindowMissMs && !evt._hit) {
      evt._scored = true;
      evt._miss = true;
      evt._result = { score: 0, grade: "miss", noteScore: 0, timingScore: 0 };
      evt._score = 0;
      updatePhraseStats(S.performPhraseStats, evt, evt._result);
      // Reset combo
      S.performCombo = 0;
      _updatePerformanceAccuracy(chart);
      continue;
    }

    // In scoring window — check snapshot
    if (snapshot.pitchClasses.length > 0) {
      var result = scorePerformanceEvent(evt, snapshot, deltaMs, S.performDifficulty, S.performMode);

      if (result.grade !== "miss") {
        evt._scored = true;
        evt._hit = true;
        evt._result = result;
        evt._score = result.score;
        updatePhraseStats(S.performPhraseStats, evt, result);

        // Update combo
        S.performCombo++;
        if (S.performCombo > S.performMaxCombo) S.performMaxCombo = S.performCombo;

        // Score points (base 100 per event * score * combo multiplier)
        var comboMult = Math.min(1 + S.performCombo * 0.1, 4);
        S.performScore += Math.round(100 * result.score * comboMult);

        // Hit feedback
        S.performLastHitLabel = result.grade.toUpperCase() + "!";
        S.performLastHitTime = Date.now();

        _updatePerformanceAccuracy(chart);
      }
    }
  }
}

function _updatePerformanceAccuracy(chart) {
  var scored = 0, hits = 0;
  for (var i = 0; i < chart.events.length; i++) {
    if (chart.events[i]._scored) {
      scored++;
      if (chart.events[i]._hit) hits++;
    }
  }
  S.performAccuracy = scored > 0 ? Math.round((hits / scored) * 100) : 0;
}

function applyPerformanceStemPreset(preset) {
  S.performPracticePreset = preset;
  // Map presets to stem mute states using existing setStemMuted/setStemVolume
  if (typeof setStemMuted !== "function") return;
  switch (preset) {
    case "full_mix":
      setStemMuted("guitar", false);
      setStemMuted("vocals", false);
      setStemMuted("drums", false);
      setStemMuted("bass", false);
      setStemMuted("piano", false);
      setStemMuted("other", false);
      break;
    case "no_guitar":
      setStemMuted("guitar", true);
      setStemMuted("vocals", false);
      setStemMuted("drums", false);
      setStemMuted("bass", false);
      setStemMuted("piano", false);
      setStemMuted("other", false);
      break;
    case "guitar_quiet":
      setStemMuted("guitar", false);
      setStemMuted("vocals", false);
      setStemMuted("drums", false);
      setStemMuted("bass", false);
      setStemMuted("piano", false);
      setStemMuted("other", false);
      // Set guitar stem volume lower
      if (typeof setStemVolume === "function") setStemVolume(0.3);
      break;
    case "guitar_solo":
      setStemMuted("guitar", false);
      setStemMuted("vocals", true);
      setStemMuted("drums", true);
      setStemMuted("bass", true);
      setStemMuted("piano", true);
      setStemMuted("other", true);
      break;
  }
}

function finishPerformance() {
  stopPerformance();
  S.performResults = finalizePerformanceResults(S.performChart, S.performPhraseStats);
  S.performStarRating = S.performResults.stars;

  // Award XP based on performance
  var xpAward = Math.max(5, Math.round(S.performResults.accuracy / 10));
  S.xp += xpAward;
  S.xpToast = { amount: xpAward, time: Date.now() };
  logHistory("perform", S.performResults.title + " - " + S.performResults.accuracy + "% accuracy", xpAward);

  saveState();
  S.screen = SCR.PERFORM_DONE;
  render();
}
```

- [ ] **Step 2: Wire action dispatcher in `js/app.js`**

In `js/app.js`, find the last action handler before the `// === Back ===` comment (around line 1113). Insert the following block just before the back handler:

```js
  // === Performance Mode ===
  if(a==="openPerform"){startPerformance(v);return;}
  if(a==="startPerform"){startPerformance(v);return;}
  if(a==="pausePerform"){pausePerformance();return;}
  if(a==="resumePerform"){resumePerformance();return;}
  if(a==="stopPerform"){stopPerformance();S.screen=SCR.HOME;S.tab=TAB.SONGS;render();return;}
  if(a==="performMode"){S.performMode=v;S.performInputSource=v;PerformanceInput.start(v);saveState();render();return;}
  if(a==="performDifficulty"){S.performDifficulty=v;saveState();render();return;}
  if(a==="performSpeed"){
    S.performSpeed=parseFloat(v);PerformanceTransport.setSpeed(S.performSpeed);saveState();render();return;
  }
  if(a==="performLoopPhrase"){
    var ph=getPerformancePhraseForTime(S.performChart,S.performCurrentSec);
    if(ph)setPerformanceLoop({startSec:ph.startSec,endSec:ph.endSec,phraseId:ph.id});
    return;
  }
  if(a==="performClearLoop"){clearPerformanceLoop();return;}
  if(a==="performPracticePreset"){applyPerformanceStemPreset(v);render();return;}
  if(a==="performRetry"){startPerformance(S.performChartId);return;}
```

- [ ] **Step 3: Extend `stopAllTimers()` for perform mode**

In `js/app.js`, in the `stopAllTimers()` function (line ~298), add at the end before the closing `}`:

```js
  if(S.performPlaying||S.performPaused){stopPerformance();}
```

- [ ] **Step 4: Add spacebar handler for perform pause/resume**

In the keyboard handler section (around line 1236), add a case for the perform screen after the existing spacebar checks:

```js
    if(S.screen===SCR.PERFORM){if(S.performPaused)act("resumePerform");else act("pausePerform");return;}
```

- [ ] **Step 5: Verify full session cycle**

Open the app. From the DevTools console:

```js
startPerformance("demo_progression")
```

Verify:
- The perform screen appears with the highway scrolling
- Events move toward the hit line
- After ~17 seconds (16s chart + 1s buffer), the results screen appears
- Score, accuracy, max combo, and phrase breakdown are visible
- "Retry" button works

- [ ] **Step 6: Commit**

```bash
git add js/performance/session.js js/app.js
git commit -m "feat(perform): implement session orchestrator, action dispatcher, and game loop"
```

---

## Task 7: Songs Entry Point, Polish, and Cleanup

**Files:**
- Modify: `js/pages/songs.js`
- Modify: `js/app.js` (if not already done above)

- [ ] **Step 1: Add Perform button to songs page**

In `js/pages/songs.js`, find the `songsTab()` function's sub-tab buttons (around line 29-41). Add a new sub-tab:

After the stems tab button, add:

```js
  h+='<button class="songs-subtab'+(S.songsSubTab==="perform"?" active":"")+'"'+clickableDiv("act(\'songsSubTab\',\'perform\')")+'>&#127918; Perform</button>';
```

Then, at the bottom of `songsTab()`, before the final `return h`, add a new section handler:

```js
  if(S.songsSubTab==="perform") return h+performSubTab();
```

Add the `performSubTab` function somewhere in `songs.js`:

```js
function performSubTab(){
  var h='<div class="card mb20" style="text-align:center;padding:24px">';
  h+='<div style="font-size:48px;margin-bottom:12px">&#127928;</div>';
  h+='<h3 style="font-size:18px;font-weight:900;color:var(--text-primary);margin:0 0 8px">Performance Mode</h3>';
  h+='<p style="font-size:13px;color:var(--text-muted);margin:0 0 16px">Play along with a scrolling chord highway. MIDI guitar or mic input.</p>';
  // Demo chart card
  h+='<div class="card" style="cursor:pointer;border:2px solid #4ECDC4;margin-bottom:12px"'
    +clickableDiv("act(\'openPerform\',\'demo_progression\')")+'>';
  h+='<div style="display:flex;justify-content:space-between;align-items:center">';
  h+='<div style="text-align:left"><h4 style="margin:0;font-size:15px;font-weight:800;color:var(--text-primary)">Demo Progression</h4>';
  h+='<p style="margin:2px 0 0;font-size:12px;color:var(--text-muted)">ChordSpark &bull; 90 BPM &bull; 8 chords</p></div>';
  h+='<div style="font-size:24px">&#127918;</div></div></div>';
  h+='<p style="font-size:11px;color:var(--text-muted)">More charts coming soon! MIDI input: '+
    (S.midiEnabled?'<span style="color:#4ECDC4;font-weight:700">Connected</span>':'<span style="color:#FF6B6B">Off &mdash; enable in Tools</span>')+'</p>';
  h+='</div>';
  return h;
}
```

- [ ] **Step 2: Verify navigation flow**

1. Open the app
2. Navigate to Songs tab
3. Click the "Perform" sub-tab
4. See the demo chart card
5. Click "Demo Progression"
6. Verify perform mode starts with the highway
7. Wait for completion or press spacebar to pause, then click Exit
8. Verify you return to Songs
9. Navigate to Practice, Drill, Tools tabs - verify they all still work

- [ ] **Step 3: Verify existing features are unbroken**

Verify each of these still works:
- Start a chord session from Practice tab
- Run a switch drill
- Open the tuner
- Run chord detection
- Play a built-in song
- Open the stem separator (if Electron)
- Import a chord sheet

- [ ] **Step 4: Commit**

```bash
git add js/pages/songs.js
git commit -m "feat(perform): add Perform sub-tab to Songs with demo chart entry point"
```

---

## Task 8: Final Integration Verification

- [ ] **Step 1: Full end-to-end test**

Run the complete flow:

1. Launch app (`npm start`)
2. Songs > Perform > Demo Progression
3. Play chords on MIDI guitar (or let it run without input for miss testing)
4. Verify highway scrolls, events reach hit line, hit/miss visual feedback works
5. Pause with spacebar, verify highway freezes
6. Resume, verify it continues
7. Change speed to 50%, verify slowdown
8. Change difficulty to Pro, verify scoring tightens
9. Click "Loop Phrase" during Phrase 2, verify it loops
10. Click "Clear Loop", verify it continues normally
11. Let chart finish, verify results screen
12. Verify phrase breakdown shows correct counts
13. Retry, verify fresh session starts
14. Exit, verify clean return to Songs

- [ ] **Step 2: No-MIDI test**

With no MIDI device connected:
1. Open perform mode
2. Verify no console errors
3. Switch to Mic mode
4. If mic is available, verify chord detection feeds into scoring
5. If no mic, verify graceful failure with no crashes

- [ ] **Step 3: Final commit (if any polish changes were needed)**

```bash
git add -A
git commit -m "fix(perform): polish and integration fixes from end-to-end testing"
```

---

## Summary

| Task | Focus | Files Created/Modified |
|------|-------|----------------------|
| 1 | Scaffold: state, constants, scripts, demo chart | 10 created, 3 modified |
| 2 | Chart loader + transport clock | 2 modified |
| 3 | Highway renderer + perform/results pages + CSS | 3 modified |
| 4 | Input normalization + audio bridges | 1 modified, 1 existing modified |
| 5 | Scoring engine | 1 modified |
| 6 | Session orchestrator + action dispatcher | 1 modified, 1 existing modified |
| 7 | Songs entry point + navigation | 1 existing modified |
| 8 | End-to-end verification | None (testing only) |
