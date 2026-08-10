// ===== Rhythm Highway Runtime Wiring Tests =====
// Run: node tests/test_rhythm_highway_runtime_wiring.js
//
// Regression guard for a shipped P0: the rhythm runtime stack existed and was
// unit-tested, but index.html never loaded it — so js/pages/rhythm_highway.js
// found SparkRhythmHighwayPageAdapter undefined, fell back to a tick that
// nothing re-schedules, and the highway froze at t=0 in production. These
// tests pin (1) that every stack module is loaded by index.html BEFORE the
// page file, and (2) that the assembled real stack actually advances the
// transport clock and merges adapter state into the emitted runtime state.

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
    console.error("    " + e.message);
  }
}

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

var STACK_IN_ORDER = [
  "js/sparksuite/core/timing_core.js",
  "js/sparksuite/core/transport_engine.js",
  "js/sparksuite/core/caption_sync_engine.js",
  "js/sparksuite/core/runtime_sync_engine.js",
  "js/sparksuite/core/metronome_runtime_adapter.js",
  "js/sparksuite/core/waveform_runtime_adapter.js",
  "js/sparksuite/core/rhythm_runtime_bridge.js",
  "js/sparksuite/core/rhythm_highway_runtime_controller.js",
  "js/sparksuite/core/rhythm_highway_page_adapter.js"
];

console.log("\n--- Rhythm Highway Runtime Wiring ---");

test("index.html loads every runtime-stack module before the rhythm highway page", function() {
  var html = loadJS("index.html");
  var pageIdx = html.indexOf('src="js/pages/rhythm_highway.js"');
  assert.ok(pageIdx >= 0, "rhythm highway page must be loaded");
  var prev = -1;
  for (var i = 0; i < STACK_IN_ORDER.length; i++) {
    var idx = html.indexOf('src="' + STACK_IN_ORDER[i] + '"');
    assert.ok(idx >= 0, STACK_IN_ORDER[i] + " must be loaded by index.html");
    assert.ok(idx < pageIdx, STACK_IN_ORDER[i] + " must load BEFORE js/pages/rhythm_highway.js");
    assert.ok(idx > prev, STACK_IN_ORDER[i] + " must load after " + (i ? STACK_IN_ORDER[i - 1] : "start"));
    prev = idx;
  }
});

// --- Assemble the real stack headlessly ---

function buildStack() {
  global.window = global;
  var pumps = [];
  var rafSeq = 0;
  global.requestAnimationFrame = function(fn) {
    rafSeq++;
    pumps.push({ id: rafSeq, fn: fn });
    return rafSeq;
  };
  global.cancelAnimationFrame = function(id) {
    for (var i = pumps.length - 1; i >= 0; i--) {
      if (pumps[i].id === id) pumps.splice(i, 1);
    }
  };

  for (var i = 0; i < STACK_IN_ORDER.length; i++) {
    global.eval(loadJS(STACK_IN_ORDER[i]));
  }

  var fakeNow = { ms: 0 };
  var transport = new global.SparkTransportEngine({
    clock: { nowMs: function() { return fakeNow.ms; } }
  });

  var gameplayStates = [];
  var gameplayStub = {
    bindRuntimeSync: function(runtimeSync) {
      return runtimeSync.bind("rhythm_gameplay", {
        update: function(state) {
          var snapshot = { songTimeSec: state.transport ? state.transport.positionSec : 0 };
          gameplayStates.push(snapshot);
          return snapshot;
        }
      });
    }
  };

  var renders = [];
  var adapter = new global.SparkRhythmHighwayPageAdapter();
  adapter.createController({
    bridgeOptions: {
      runtime: { transportEngine: transport },
      gameplay: gameplayStub
    },
    onRender: function(state) { renders.push(state); }
  });

  return {
    adapter: adapter,
    fakeNow: fakeNow,
    pumps: pumps,
    renders: renders,
    gameplayStates: gameplayStates,
    pump: function(advanceMs) {
      fakeNow.ms += advanceMs;
      var due = pumps.splice(0, pumps.length);
      for (var i = 0; i < due.length; i++) due[i].fn(fakeNow.ms);
    }
  };
}

test("assembled stack advances the transport clock through onRender", function() {
  var stack = buildStack();
  stack.adapter.start({ chartId: "wiring_check", bpm: 120 }, { durationSec: 10, autoPlay: true });

  stack.pump(500);
  stack.pump(500);
  stack.pump(500);

  assert.ok(stack.renders.length >= 3, "onRender must fire per animation frame");
  var last = stack.renders[stack.renders.length - 1];
  assert.ok(last.transport, "runtime state must carry transport");
  assert.ok(
    last.transport.positionSec > 1.4 && last.transport.positionSec < 1.6,
    "transport must advance ~1.5s after three 500ms frames (got " + last.transport.positionSec + ")"
  );
  var first = stack.renders[0];
  assert.ok(
    last.transport.positionSec > first.transport.positionSec,
    "song time must move forward frame over frame — a frozen clock is the regression this pins"
  );
});

test("adapter-derived state is merged into the emitted runtime state", function() {
  var stack = buildStack();
  stack.adapter.start({ chartId: "wiring_check", bpm: 120 }, { durationSec: 10, autoPlay: true });
  stack.pump(500);

  var state = stack.renders[stack.renders.length - 1];
  assert.ok(Array.isArray(state.metronome), "metronome events must be merged, not null");
  assert.ok(state.waveform && typeof state.waveform.cursorRatio !== "undefined", "waveform state must be merged, not null");
  assert.ok(state.gameplay && typeof state.gameplay.songTimeSec === "number", "gameplay snapshot must mirror into the canonical slot");
  assert.strictEqual(state.gameplay.songTimeSec, state.transport.positionSec, "gameplay snapshot derives from the same transport position");
  assert.ok(stack.gameplayStates.length >= 1, "bound gameplay engine must receive runtime updates");
});

test("stopping the controller halts the frame loop", function() {
  var stack = buildStack();
  stack.adapter.start({ chartId: "wiring_check", bpm: 120 }, { durationSec: 10, autoPlay: true });
  stack.pump(500);
  stack.adapter.stop();
  var rendersAtStop = stack.renders.length;
  stack.pump(500);
  stack.pump(500);
  assert.strictEqual(stack.renders.length, rendersAtStop, "no frames may fire after stop");
});

console.log("");
console.log(passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
