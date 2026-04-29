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

const eventBusModule = require("../js/sparksuite/core/spark_event_bus.js");
const debugBundleModule = require("../js/sparksuite/debug/debug_bundle.js");

test("SparkEventBus retains recent events and notifies listeners", function() {
  const bus = new eventBusModule.SparkEventBus({ maxEvents: 2 });
  const seen = [];
  const off = bus.on("gateway.action.execute", function(event) {
    seen.push(event.type + ":" + event.payload.actionName);
  });

  bus.emit("gateway.action.execute", { actionName: "practice.start" });
  bus.emit("gateway.action.result", { actionName: "practice.start" });
  bus.emit("gateway.action.execute", { actionName: "practice.complete" });
  off();
  bus.emit("gateway.action.execute", { actionName: "practice.resume" });

  const recent = bus.getRecent();
  assert.strictEqual(recent.length, 2);
  assert.strictEqual(recent[0].type, "gateway.action.execute");
  assert.strictEqual(recent[0].payload.actionName, "practice.complete");
  assert.strictEqual(recent[1].payload.actionName, "practice.resume");
  assert.deepStrictEqual(seen, [
    "gateway.action.execute:practice.start",
    "gateway.action.execute:practice.complete"
  ]);
});

test("buildSparkDebugBundle includes recent events, errors, and handler report", function() {
  const bus = new eventBusModule.SparkEventBus({ maxEvents: 10 });
  bus.emit("gateway.action.execute", { actionName: "practice.start" });
  bus.emit("error.captured", { code: "SESSION_INVALID", message: "bad plan" });

  const bundle = debugBundleModule.buildSparkDebugBundle({
    eventBus: bus,
    gateway: {
      getMissingHandlerReport() {
        return { "practice.complete": 2 };
      }
    },
    sparkCore: {
      getActiveSessionView() {
        return {
          plan: {
            id: "session_1",
            flow: "guided",
            lessonId: "lesson_1",
            instrumentType: "guitar"
          },
          runtimeState: {
            activeSegmentId: "segment_1"
          },
          activeExercise: {
            id: "exercise_1"
          }
        };
      },
      getRuntimeState() {
        return {
          screen: "SCR.GUIDED",
          guidedStep: "review"
        };
      },
      storage: {
        getSettings() {
          return {
            reducedMotion: true
          };
        }
      }
    }
  });

  assert.strictEqual(bundle.session.id, "session_1");
  assert.strictEqual(bundle.session.activeSegmentId, "segment_1");
  assert.strictEqual(bundle.session.activeExerciseId, "exercise_1");
  assert.strictEqual(bundle.recentEvents.length, 2);
  assert.strictEqual(bundle.recentErrors.length, 1);
  assert.strictEqual(bundle.recentErrors[0].payload.code, "SESSION_INVALID");
  assert.deepStrictEqual(bundle.missingHandlers, { "practice.complete": 2 });
  assert.deepStrictEqual(bundle.runtimeState, { screen: "SCR.GUIDED", guidedStep: "review" });
  assert.deepStrictEqual(bundle.settings, { reducedMotion: true });
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
