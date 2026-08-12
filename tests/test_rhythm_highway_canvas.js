// ===== Rhythm Highway Canvas Renderer Tests =====
// Run: node tests/test_rhythm_highway_canvas.js
//
// Highway convergence phase C: the rhythm highway renders through the shared
// SparkHighway (PixiJS) renderer that performance mode uses, with the DOM-div
// renderer kept as the classic fallback (reduced motion, missing bundle, or
// the S.rhythmHighwayClassicRenderer toggle). These tests drive the REAL page
// + REAL runtime stack + REAL gameplay engine headlessly against a stub
// SparkHighway, and pin:
// - the canvas path feeds the full chart once and updates per frame with the
//   advancing transport clock, WITHOUT full-page re-renders per frame
// - engine note outcomes mirror onto renderer event flags (_hit)
// - the classic fallback keeps the per-frame render() behavior
// - the action layer skips full renders while the canvas is live

var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (e) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + (e.stack ? e.stack.split("\n").slice(0, 3).join("\n    ") : e.message));
  }
}

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function loadVM(file) {
  var full = path.join(__dirname, "..", file);
  require("vm").runInThisContext(fs.readFileSync(full, "utf8"), { filename: full });
}

var FILES = [
  "js/utils/normalize.js",
  "js/sparksuite/domain/types.js",
  "js/sparksuite/domain/tempo_map.js",
  "js/sparksuite/domain/note_event.js",
  "js/sparksuite/domain/phrase.js",
  "js/sparksuite/domain/chart.js",
  "js/sparksuite/domain/gameplay_result.js",
  "js/sparksuite/domain/engine_preset.js",
  "js/sparksuite/core/timing_core.js",
  "js/sparksuite/core/calibration_engine.js",
  "js/sparksuite/core/timing_engine.js",
  "js/sparksuite/core/replay_engine.js",
  "js/sparksuite/core/input_judge.js",
  "js/sparksuite/core/scoring_engine.js",
  "js/sparksuite/core/rhythm_gameplay_engine.js",
  "js/sparksuite/core/transport_engine.js",
  "js/sparksuite/core/caption_sync_engine.js",
  "js/sparksuite/core/runtime_sync_engine.js",
  "js/sparksuite/core/metronome_runtime_adapter.js",
  "js/sparksuite/core/waveform_runtime_adapter.js",
  "js/sparksuite/core/rhythm_runtime_bridge.js",
  "js/sparksuite/core/rhythm_highway_runtime_controller.js",
  "js/sparksuite/core/rhythm_highway_page_adapter.js",
  "js/pages/rhythm_highway.js"
];

function StubHighway(canvas, skin) {
  this.canvas = canvas;
  this.skin = skin;
  this._ready = true;
  this.setChartCalls = [];
  this.updateCalls = [];
  this.hitCalls = [];
  this.destroyed = false;
  StubHighway.instances.push(this);
}
StubHighway.prototype.init = function() { return Promise.resolve(); };
StubHighway.prototype.setChart = function(events, phrases) { this.setChartCalls.push({ events: events, phrases: phrases }); this.events = events; };
StubHighway.prototype.update = function(t, combo) { this.updateCalls.push({ t: t, combo: combo }); };
StubHighway.prototype.notifyHit = function(x, y, color) { this.hitCalls.push({ x: x, y: y, color: color }); };
StubHighway.prototype.destroy = function() { this.destroyed = true; };
StubHighway.GUITAR_SKIN = {
  laneCount: 6, noteShape: "circle", laneIndicatorStyle: "buttons", laneSpacing: 80,
  laneColors: [[255, 50, 50], [255, 180, 0], [255, 255, 50], [50, 180, 255], [50, 255, 50], [200, 50, 255]]
};

function makeEnv(opts) {
  opts = opts || {};
  global.window = global;
  StubHighway.instances = [];
  if (opts.withHighway !== false) global.SparkHighway = StubHighway;
  else delete global.SparkHighway;

  var pumps = [];
  var rafSeq = 0;
  global.requestAnimationFrame = function(fn) { rafSeq++; pumps.push({ id: rafSeq, fn: fn }); return rafSeq; };
  global.cancelAnimationFrame = function(id) {
    for (var i = pumps.length - 1; i >= 0; i--) if (pumps[i].id === id) pumps.splice(i, 1);
  };

  var fakeNow = { ms: 0 };
  global.performance = { now: function() { return fakeNow.ms; } };

  var canvasEl = { id: "rhythm-highway-canvas" };
  var env = {
    pumps: pumps,
    fakeNow: fakeNow,
    canvasEl: canvasEl,
    renderCount: 0,
    pump: function(advanceMs) {
      fakeNow.ms += advanceMs;
      var due = pumps.splice(0, pumps.length);
      for (var i = 0; i < due.length; i++) due[i].fn(fakeNow.ms);
    }
  };

  global.document = {
    getElementById: function(id) {
      if (id === "rhythm-highway-canvas" && opts.canvasOnScreen !== false) return canvasEl;
      return null;
    },
    querySelectorAll: function() { return []; }
  };

  global.S = {
    level: 1,
    rhythmHighwayHeldMask: 0,
    rhythmHighwayClassicRenderer: !!opts.classic,
    rhythmHighwayPreset: null,
    rhythmHighwayLoop: null,
    settings: opts.reducedMotion ? { accessibility: { reducedMotion: true } } : {}
  };
  global.SCR = { RHYTHM_HIGHWAY: "rhythmHighway" };
  global.render = function() { env.renderCount++; };
  global.saveState = function() {};
  global.escHTML = function(s) { return String(s == null ? "" : s); };
  global.snd = function() {};
  global.act = function() {};
  global.sparkCore = null;
  global.SparkInstruments = undefined;
  global.SparkSessionTypes = { FLOW_DAILY_PRACTICE: "daily_practice" };

  for (var i = 0; i < FILES.length; i++) loadVM(FILES[i]);
  return env;
}

function makePayload() {
  var notes = [];
  for (var i = 0; i < 8; i++) {
    notes.push({ id: "n" + i, tick: i * 480, tickLength: 240, laneMask: 1 << (i % 5), label: "N" + i });
  }
  return {
    chartId: "canvas_check",
    bpm: 120,
    laneCount: 5,
    songChart: {
      song: { id: "canvas_check", title: "Canvas Check", durationSec: 8 },
      tempoMap: new global.SparkTempoMap({ ppq: 480, bpm: 120 }),
      tracks: { guitar: { notes: notes, phrases: [] } }
    }
  };
}

console.log("\n--- Rhythm Highway Canvas Renderer ---");

test("canvas mode feeds the full chart and updates with the advancing clock, no per-frame renders", function() {
  var env = makeEnv();
  assert.strictEqual(global.startRhythmHighwayPayload(makePayload()), true);
  var rendersAfterStart = env.renderCount;
  env.pump(500);
  env.pump(500);
  env.pump(500);

  assert.strictEqual(StubHighway.instances.length, 1, "one renderer instance");
  var hw = StubHighway.instances[0];
  assert.strictEqual(hw.skin.laneCount, 5, "skin lane count follows the rhythm payload");
  assert.ok(hw.setChartCalls.length >= 1, "chart fed to the renderer");
  assert.strictEqual(hw.events.length, 8, "all chart notes reach the renderer, not a window");
  assert.ok(Math.abs(hw.events[1].t - 0.5) < 0.01, "event times derive from the tempo map (tick 480 = 1 beat @120bpm = 0.5s)");
  assert.ok(hw.updateCalls.length >= 3, "renderer updated per frame");
  var lastUpdate = hw.updateCalls[hw.updateCalls.length - 1];
  assert.ok(lastUpdate.t > 1.4 && lastUpdate.t < 1.6, "renderer clock advances with the transport (got " + lastUpdate.t + ")");
  assert.strictEqual(env.renderCount, rendersAfterStart, "steady-state frames must not full-render the page");
  assert.ok(global._sparkRhythmHighwayHandlesFrameRender(), "frame-render ownership reported to the action layer");
});

test("engine hits mirror onto renderer event flags", function() {
  var env = makeEnv();
  global.startRhythmHighwayPayload(makePayload());
  env.pump(100);
  var hw = StubHighway.instances[0];

  // Note n0 sits at t=0, lane 0. Strum 100ms late — inside the good window.
  global.S.rhythmHighwayHeldMask = 1;
  global._sparkRhythmHighwayStrum();
  env.pump(16);

  assert.strictEqual(hw.events[0]._hit, true, "hit note flagged for the renderer");
  assert.ok(!hw.events[1]._hit, "other notes untouched");
});

test("chord notes render one gem per required lane, all mirroring the note's state", function() {
  var env = makeEnv();
  var payload = makePayload();
  // Make n0 a two-lane chord (lanes 0+1) — the judge requires the full mask,
  // so the renderer must show a gem on every required lane.
  payload.songChart.tracks.guitar.notes[0].laneMask = 3;
  global.startRhythmHighwayPayload(payload);
  env.pump(100);
  var hw = StubHighway.instances[0];
  assert.strictEqual(hw.events.length, 9, "8 notes, one of them a 2-lane chord = 9 renderer events");
  var chordGems = hw.events.filter(function(e) { return e.laneMask === 3; });
  assert.strictEqual(chordGems.length, 2, "one gem per required lane");
  assert.strictEqual(chordGems[0].lane + chordGems[1].lane, 1, "gems sit on lanes 0 and 1");

  global.S.rhythmHighwayHeldMask = 3;
  global._sparkRhythmHighwayStrum();
  env.pump(16);
  assert.ok(chordGems[0]._hit && chordGems[1]._hit, "a chord hit flags every lane's gem");
});

test("the colorblind-safe palette reaches the canvas skin", function() {
  var env = makeEnv();
  global.S.settings = { accessibility: { colorblindSafeLanes: true } };
  global.startRhythmHighwayPayload(makePayload());
  env.pump(100);
  var hw = StubHighway.instances[0];
  assert.deepStrictEqual(hw.skin.laneColors[0], [17, 119, 51], "gem colors come from the accessible lane palette (#117733)");
});

test("normal completion destroys the renderer (no WebGL leak after a finished run)", function() {
  var env = makeEnv();
  global.startRhythmHighwayPayload(makePayload());
  env.pump(500);
  var hw = StubHighway.instances[0];
  assert.ok(!hw.destroyed, "alive mid-run");
  // Push far past the last note so everything misses and the run finalizes.
  for (var i = 0; i < 12; i++) env.pump(500);
  assert.ok(global.S.rhythmHighwayResult, "run finalized");
  assert.strictEqual(hw.destroyed, true, "finalize must release the renderer");
});

test("classic flag falls back to per-frame full renders and no renderer instance", function() {
  var env = makeEnv({ classic: true });
  global.startRhythmHighwayPayload(makePayload());
  var rendersAfterStart = env.renderCount;
  env.pump(500);
  env.pump(500);
  assert.strictEqual(StubHighway.instances.length, 0, "no renderer in classic mode");
  assert.ok(env.renderCount >= rendersAfterStart + 2, "classic mode re-renders per frame");
  assert.ok(!global._sparkRhythmHighwayHandlesFrameRender(), "action layer must full-render in classic mode");
});

test("reduced motion uses the classic renderer", function() {
  var env = makeEnv({ reducedMotion: true });
  global.startRhythmHighwayPayload(makePayload());
  env.pump(500);
  assert.strictEqual(StubHighway.instances.length, 0);
});

test("missing renderer bundle degrades to classic without errors", function() {
  var env = makeEnv({ withHighway: false });
  global.startRhythmHighwayPayload(makePayload());
  env.pump(500);
  assert.ok(env.renderCount >= 1, "page still renders");
});

test("action layer skips full renders while the canvas is live", function() {
  var source = loadJS("js/actions/studio_family.js");
  assert.ok(source.indexOf("_sparkRhythmHighwayHandlesFrameRender") >= 0, "strum/lane actions must consult frame-render ownership");
  assert.ok(source.indexOf("rhythmHighwayToggleRenderer") >= 0, "renderer toggle action exists");
});

console.log("");
console.log(passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
