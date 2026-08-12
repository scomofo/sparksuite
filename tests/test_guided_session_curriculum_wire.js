var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function loadVM(file) {
  var full = path.join(__dirname, "..", file);
  require("vm").runInThisContext(fs.readFileSync(full, "utf8"), { filename: full });
}

function test(name, fn) {
  try { fn(); console.log("  PASS: " + name); }
  catch (e) { console.error("  FAIL: " + name + "\n    " + e.message); process.exitCode = 1; }
}

console.log("\n--- buildGuidedSession curriculum wiring ---");

function makeSession(num, title) {
  return { num: num, title: title || "Session " + num, steps: [] };
}

function setupEnv() {
  global.window = global;
  global.S = {
    completedGuidedSessions: [],
    completedSessions: [],
    completedGuidedSessionsByInstrument: {}
  };
  global.SparkCurriculumService = null;
  global.SparkSessionTypes = { FLOW_GUIDED_SESSION: "guided_session" };
  global.clone = function(o) { return JSON.parse(JSON.stringify(o)); };
  global.SessionPlan = function(opts) { for (var k in opts) this[k] = opts[k]; };
  global.SparkProgressBridge = null;
  global.normalizeGuidedPlan = function(p) { return p; };
  global.buildGuidedSessionShell = function() {
    return { segments: [], exercises: [], totalDurationSec: 600 };
  };
  eval(loadJS("js/sparksuite/core/session_engine.js"));
}

test("when sessionNum absent and CurriculumService missing, defaults to session 1", function() {
  setupEnv();
  global.SparkCurriculumService = undefined;
  var engine = new SparkSuiteSessionEngine();
  var plan = engine.buildGuidedSession({
    instrumentContext: { sessions: [makeSession(1), makeSession(2), makeSession(3)], instrumentType: "guitar" }
  });
  assert.strictEqual(plan.context.guidedSession, 1);
  assert.strictEqual(plan.context.allComplete, false);
});

test("when sessionNum absent, CurriculumService.getNextGuidedSession is called and result used", function() {
  setupEnv();
  var sessions = [makeSession(1), makeSession(2), makeSession(3)];
  var called = false;
  global.SparkCurriculumService = {
    getNextGuidedSession: function(sess, ctx) {
      called = true;
      assert.ok(Array.isArray(sess), "sessions passed");
      assert.strictEqual(ctx.instrumentKey, "guitar");
      return { session: sess[1], sessionNum: 2, index: 1, allComplete: false };
    }
  };
  var engine = new SparkSuiteSessionEngine();
  var plan = engine.buildGuidedSession({
    instrumentContext: { sessions: sessions, instrumentType: "guitar" }
  });
  assert.ok(called, "CurriculumService.getNextGuidedSession must be called");
  assert.strictEqual(plan.context.guidedSession, 2, "should use curriculum-chosen session 2");
  assert.strictEqual(plan.context.allComplete, false);
});

test("allComplete:true surfaces into plan context when all sessions done", function() {
  setupEnv();
  var sessions = [makeSession(1), makeSession(2)];
  global.SparkCurriculumService = {
    getNextGuidedSession: function(sess) {
      return { session: sess[1], sessionNum: 2, index: 1, allComplete: true };
    }
  };
  var engine = new SparkSuiteSessionEngine();
  var plan = engine.buildGuidedSession({
    instrumentContext: { sessions: sessions, instrumentType: "guitar" }
  });
  assert.strictEqual(plan.context.allComplete, true);
});

test("caller-pinned sessionNum is honoured without calling CurriculumService", function() {
  setupEnv();
  var sessions = [makeSession(1), makeSession(2), makeSession(3)];
  var called = false;
  global.SparkCurriculumService = {
    getNextGuidedSession: function() { called = true; return null; }
  };
  var engine = new SparkSuiteSessionEngine();
  var plan = engine.buildGuidedSession({
    sessionNum: 3,
    instrumentContext: { sessions: sessions, instrumentType: "guitar" }
  });
  assert.strictEqual(called, false, "CurriculumService must NOT be called when sessionNum pinned");
  assert.strictEqual(plan.context.guidedSession, 3);
});

test("instrumentKey is passed from instrumentContext.instrument", function() {
  setupEnv();
  var sessions = [makeSession(1)];
  var capturedCtx = null;
  global.SparkCurriculumService = {
    getNextGuidedSession: function(sess, ctx) {
      capturedCtx = ctx;
      return { session: sess[0], sessionNum: 1, index: 0, allComplete: false };
    }
  };
  var engine = new SparkSuiteSessionEngine();
  engine.buildGuidedSession({
    instrumentContext: { sessions: sessions, instrument: "bass", instrumentType: "bass" }
  });
  assert.strictEqual(capturedCtx.instrumentKey, "bass");
});

if (process.exitCode) process.exit(process.exitCode);
