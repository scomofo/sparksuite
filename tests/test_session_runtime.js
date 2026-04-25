var assert = require("assert");
var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  PASS: " + name); }
  catch (e) { failed++; console.error("  FAIL: " + name + " -- " + e.message); }
}

global.window = {};
global.S = {};
global.SparkSessionTypes = { FLOW_DAILY_PRACTICE: "daily_practice" };
global.SparkSessionSegmentTypes = { normalize: function(t) { return t || "practice"; } };
global.SparkInstruments = {
  getAll: function() {
    return [{ id: "pianospark", appId: "pianospark", instrument: "piano" }];
  }
};
global.SparkExecutionGateway = {
  runSessionSegment: function() {
    return false;
  }
};

require("../js/sparksuite/core/session_runtime.js");
var Runtime = window.SparkSessionRuntime;

console.log("=== Session Runtime Tests ===");

test("startSessionLoop returns null without engines", function() {
  var session = Runtime.startSessionLoop();
  assert.strictEqual(session, null);
});

test("runSegment returns false with no active session", function() {
  assert.strictEqual(Runtime.runSegment(0), false);
});

test("recordEvent stores events", function() {
  Runtime.recordEvent({ type: "hit", delta: 10 });
  Runtime.recordEvent({ type: "miss", delta: 80 });
  assert.strictEqual(Runtime.getSessionEvents().length, 2);
});

test("completeSegment returns hasNext false with no session", function() {
  var result = Runtime.completeSegment({ accuracy: 0.8 });
  assert.strictEqual(result.hasNext, false);
});

test("getActiveSession returns null initially", function() {
  assert.strictEqual(Runtime.getActiveSession(), null);
});

test("getActiveSegmentIndex returns -1 initially", function() {
  assert.strictEqual(Runtime.getActiveSegmentIndex(), -1);
});

test("runSegment delegates segment launches to SparkExecutionGateway when available", function() {
  var captured = null;
  global.SparkExecutionGateway.runSessionSegment = function(session, segment, options) {
    captured = {
      session: session,
      segment: segment,
      options: options
    };
    return "gateway_launch";
  };

  global.window.sparkCore = {
    startSession: function() {
      return {
        segments: [{ id: "seg_1", type: "practice", exerciseIds: ["ex_1"] }],
        exercises: [{
          id: "ex_1",
          data: {
            core: { skill: "timing", instrument: "pianospark" },
            gameplay: { payload: { adapterType: "pianospark" } }
          }
        }]
      };
    }
  };

  Runtime.startSessionLoop();
  var launched = Runtime.runSegment(0);

  assert.strictEqual(launched, "gateway_launch");
  assert.ok(captured);
  assert.strictEqual(captured.segment.id, "seg_1");
  assert.strictEqual(captured.options.source, "session_runtime");
  assert.strictEqual(captured.options.segmentIndex, 0);
  assert.strictEqual(captured.options.exercise.id, "ex_1");
  assert.strictEqual(Runtime.getActiveSegment().id, "seg_1");
  assert.strictEqual(Runtime.getActiveExercise().id, "ex_1");

  delete global.window.sparkCore;
  global.SparkExecutionGateway.runSessionSegment = function() {
    return false;
  };
});

test("runSegment falls back to direct legacy launchers when SparkExecutionGateway is unavailable", function() {
  var captured = null;
  global.startPlayableRhythmHighwayPayload = function(payload, options) {
    captured = { payload: payload, options: options };
    return true;
  };
  delete global.SparkExecutionGateway;

  global.window.sparkCore = {
    startSession: function() {
      return {
        segments: [{ id: "seg_1", type: "practice", exerciseIds: ["ex_1"] }],
        exercises: [{
          id: "ex_1",
          data: {
            core: { skill: "timing", instrument: "pianospark" },
            gameplay: { payload: { adapterType: "pianospark" } }
          }
        }]
      };
    }
  };

  Runtime.startSessionLoop();
  var launched = Runtime.runSegment(0);

  assert.strictEqual(launched, true);
  assert.ok(captured);
  assert.strictEqual(captured.options.instrument, "piano");

  delete global.window.sparkCore;
  delete global.startPlayableRhythmHighwayPayload;
  global.SparkExecutionGateway = {
    runSessionSegment: function() {
      return false;
    }
  };
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
