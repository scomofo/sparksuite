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

global.window = {};
global.document = {
  body: {
    children: [],
    appendChild(node) {
      node.parentNode = this;
      this.children.push(node);
    },
    removeChild(node) {
      this.children = this.children.filter(function(entry) {
        return entry !== node;
      });
      node.parentNode = null;
    }
  },
  createElement(tagName) {
    return {
      tagName: tagName,
      style: {},
      innerHTML: "",
      parentNode: null
    };
  }
};

let intervalFn = null;
let clearedInterval = null;
global.setInterval = function(fn) {
  intervalFn = fn;
  return 42;
};
global.clearInterval = function(id) {
  clearedInterval = id;
};

const debugStateModule = require("../js/sparksuite/debug/spark_debug_state.js");
const debugOverlayModule = require("../js/sparksuite/debug/spark_debug_overlay.js");

test("createSparkDebugState reads current session, gateway, runtime, and score", function() {
  const recentEvents = [{ type: "gateway.action.execute", payload: { actionName: "practice.start" } }];
  const state = debugStateModule.createSparkDebugState({
    sparkCore: {
      currentSession: { id: "fallback_session", instrument: "guitar", lessonId: "lesson_fallback" },
      getActiveSessionView() {
        return {
          plan: { id: "session_1", instrument: "piano", lessonId: "lesson_1" },
          segment: { id: "seg_1", type: "practice" },
          exercise: { id: "ex_1" },
          runtimeState: {
            transport: { status: "running", positionMs: 500 },
            score: { accuracy: 0.9 }
          },
          recovery: {
            error: {
              code: "SESSION_INVALID",
              message: "bad session"
            }
          }
        };
      },
      getEventBus() {
        return {
          getRecent() {
            return recentEvents;
          }
        };
      }
    },
    gateway: {
      getLastAction() {
        return { actionName: "practice.start" };
      },
      getLastResult() {
        return { result: true };
      },
      getMissingHandlerReport() {
        return { "practice.start": 1 };
      }
    },
    runtime: {
      getActiveSegment() {
        return { id: "seg_runtime", type: "song" };
      },
      getActiveExercise() {
        return { id: "ex_runtime" };
      },
      getSessionState() {
        return "running";
      },
      timingConfig: { hitWindowMs: 140, noteSpeed: 0.32 },
      assistConfig: { speedMultiplier: 0.75, noFailMode: true },
      score: { combo: 12 }
    }
  });

  assert.strictEqual(state.getCurrentSession().id, "session_1");
  assert.strictEqual(state.getCurrentInstrument(), "piano");
  assert.strictEqual(state.getCurrentLesson(), "lesson_1");
  assert.strictEqual(state.getCurrentSegment().id, "seg_runtime");
  assert.strictEqual(state.getCurrentExercise().id, "ex_runtime");
  assert.strictEqual(state.getSessionState(), "running");
  assert.deepStrictEqual(state.getLastAction(), { actionName: "practice.start" });
  assert.deepStrictEqual(state.getLastResult(), { result: true });
  assert.deepStrictEqual(state.getMissingHandlers(), { "practice.start": 1 });
  assert.deepStrictEqual(state.getTimingConfig(), { hitWindowMs: 140, noteSpeed: 0.32 });
  assert.deepStrictEqual(state.getAssistConfig(), { speedMultiplier: 0.75, noFailMode: true });
  assert.deepStrictEqual(state.getScore(), { combo: 12 });
  assert.deepStrictEqual(state.getRecentEvents(), recentEvents);
  assert.deepStrictEqual(state.getLastError(), { code: "SESSION_INVALID", message: "bad session" });
});

test("mountSparkDebugOverlay renders payload and cleans up cleanly", function() {
  const debugState = {
    getCurrentSession() {
      return { id: "session_overlay", instrument: "ukulele", lessonId: "lesson_overlay" };
    },
    getCurrentInstrument() {
      return "ukulele";
    },
    getCurrentLesson() {
      return "lesson_overlay";
    },
    getCurrentSegment() {
      return { id: "seg_overlay" };
    },
    getCurrentExercise() {
      return { id: "ex_overlay" };
    },
    getSessionState() {
      return { status: "paused" };
    },
    getLastAction() {
      return { actionName: "practice.start" };
    },
    getLastResult() {
      return { result: "handled" };
    },
    getMissingHandlers() {
      return { "practice.complete": 2 };
    },
    getTimingConfig() {
      return { hitWindowMs: 140, noteSpeed: 0.32 };
    },
    getAssistConfig() {
      return { speedMultiplier: 0.75, noFailMode: true };
    },
    getScore() {
      return { accuracy: 0.88, combo: 5 };
    },
    getRecentEvents() {
      return [{ type: "runtime.input.received", payload: { lane: 2 } }];
    },
    getLastError() {
      return { code: "ACTION_HANDLER_MISSING", message: "resume handler missing" };
    }
  };

  const unmount = debugOverlayModule.mountSparkDebugOverlay(debugState);
  assert.strictEqual(document.body.children.length, 1);
  assert.strictEqual(document.body.children[0].id, "spark-debug-overlay");
  assert.ok(document.body.children[0].innerHTML.includes("Spark Debug"));
  assert.ok(document.body.children[0].innerHTML.includes("session_overlay"));
  assert.strictEqual(typeof intervalFn, "function");

  intervalFn();
  assert.ok(document.body.children[0].innerHTML.includes("practice.complete"));
  assert.ok(document.body.children[0].innerHTML.includes("speedMultiplier"));
  assert.ok(document.body.children[0].innerHTML.includes("runtime.input.received"));
  assert.ok(document.body.children[0].innerHTML.includes("ACTION_HANDLER_MISSING"));

  unmount();
  assert.strictEqual(clearedInterval, 42);
  assert.strictEqual(document.body.children.length, 0);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
