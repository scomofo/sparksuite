const assert = require("assert");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log("PASS:", name);
  } catch (error) {
    failed += 1;
    console.error("FAIL:", name, "--", error.message);
  }
}

global.window = {
  location: { search: "" },
  SparkSuiteInstrumentAdapters: {}
};

global.document = {
  body: {
    appendChild() {},
    removeChild() {}
  },
  createElement() {
    return {
      style: {},
      innerHTML: "",
      parentNode: null
    };
  }
};

global.SparkSuiteStorage = function SparkSuiteStorage() {
  this.setCurrentPlanId = function() {};
};
global.SparkAIEngine = function SparkAIEngine() {
  this.suggestNextFlow = function() {
    return "daily_practice";
  };
};
global.SparkInstrumentManager = function SparkInstrumentManager() {
  this.register = function() {};
  this.getActiveContext = function() {
    return { appId: "chordspark", instrumentType: "guitar" };
  };
};
global.SparkSuitePsychologyEngine = function SparkSuitePsychologyEngine() {};
global.SparkSuiteCurriculumEngine = function SparkSuiteCurriculumEngine() {};
global.SparkSuitePracticeEngine = function SparkSuitePracticeEngine() {};
global.SparkSuiteProgressEngine = function SparkSuiteProgressEngine() {
  this.completeSession = function() {
    return {
      planCompleted: true,
      completionSummary: { ok: true }
    };
  };
};
global.SparkSuiteSessionEngine = function SparkSuiteSessionEngine() {
  this.buildSession = function() {
    return new window.SessionPlan({
      id: "session_ok",
      flow: "daily_practice",
      instrumentType: "guitar",
      segments: [{ id: "seg_1", type: "practice", exerciseIds: ["ex_1"] }],
      exercises: [{ id: "ex_1", type: "practice", data: { gameplay: { payload: { adapterType: "guitar" } } } }],
      rewards: { xp: 10 }
    });
  };
};
global.SparkSessionTypes = {
  FLOW_DAILY_PRACTICE: "daily_practice",
  FLOW_GUIDED_SESSION: "guided_session",
  FLOW_PERFORMANCE_SONG: "performance_song",
  FLOW_SPOTIFY_PLAY_ALONG: "spotify_play_along"
};
global.SparkProgressBridge = {
  syncPlanToState() {}
};
global.SparkSessionStateMachine = function SparkSessionStateMachine() {
  this.sessionId = "session_ok";
  this.transition = function() {};
  this.snapshot = function() {
    return { state: "ready", sessionId: this.sessionId };
  };
};

const errorCodesModule = require("../js/sparksuite/core/error_codes.js");
const sparkErrorModule = require("../js/sparksuite/core/spark_error.js");
const errorBoundaryModule = require("../js/sparksuite/core/error_boundary.js");
const errorViewModule = require("../js/sparksuite/ui/error_view.js");
require("../js/sparksuite/domain/session.js");
const gateway = require("../js/sparksuite/core/execution_gateway.js");
require("../js/sparksuite/core/spark_core.js");

const SparkErrorCodes = errorCodesModule.SparkErrorCodes;
const SparkError = sparkErrorModule.SparkError;
const SparkErrorBoundary = errorBoundaryModule.SparkErrorBoundary;

test("SessionPlan throws structured error for missing exercise references", function() {
  assert.throws(function() {
    new window.SessionPlan({
      id: "bad_session",
      flow: "daily_practice",
      segments: [{ id: "seg_missing", exerciseIds: ["ex_missing"] }],
      exercises: [{ id: "ex_present", type: "practice", data: {} }],
      rewards: { xp: 0 }
    });
  }, function(error) {
    assert.strictEqual(error.code, SparkErrorCodes.SESSION_INVALID_EXERCISE_REFERENCE);
    assert.strictEqual(error.context.segmentId, "seg_missing");
    assert.strictEqual(error.context.exerciseId, "ex_missing");
    return true;
  });
});

test("Execution gateway throws structured error for missing known handlers", function() {
  gateway.clearHandlers();
  gateway.setStrict(true);
  assert.throws(function() {
    gateway.execute("practice.complete", { score: 1 });
  }, function(error) {
    assert.strictEqual(error.code, SparkErrorCodes.ACTION_HANDLER_MISSING);
    assert.strictEqual(error.context.actionName, "practice.complete");
    return true;
  });
});

test("Error boundary normalizes and emits structured errors", function() {
  const events = [];
  const boundary = new SparkErrorBoundary({
    eventBus: {
      emit(name, payload) {
        events.push({ name, payload });
      }
    }
  });

  const result = boundary.run("session.start", function() {
    throw new SparkError(SparkErrorCodes.CONTENT_INVALID, "Bad lesson payload", { lessonId: "lesson_1" });
  });

  assert.strictEqual(result, null);
  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].name, "error.captured");
  assert.strictEqual(events[0].payload.error.code, SparkErrorCodes.CONTENT_INVALID);
});

test("SparkCore stores recovery state and error view renders recovery actions", function() {
  const core = window.sparkCore;
  const error = new SparkError(
    SparkErrorCodes.ACTION_HANDLER_MISSING,
    "Missing action handler",
    { actionName: "practice.complete" }
  );
  core.captureStructuredError(error, { label: "completeSession" });

  const recovery = core.getRecoveryState();
  assert.strictEqual(recovery.error.code, SparkErrorCodes.ACTION_HANDLER_MISSING);
  assert.strictEqual(recovery.context.label, "completeSession");

  const html = errorViewModule.renderSparkErrorView(recovery);
  assert.ok(html.includes("Retry current action"));
  assert.ok(html.includes("Export debug bundle"));
  assert.ok(html.includes("ACTION_HANDLER_MISSING"));

  const bundle = core.applyRecoveryAction("export_debug_bundle");
  assert.strictEqual(bundle.error.code, SparkErrorCodes.ACTION_HANDLER_MISSING);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
