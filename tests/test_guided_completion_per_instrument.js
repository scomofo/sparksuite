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

console.log("\n--- Per-instrument guided-session completion scoping ---");

function freshS() {
  return {
    completedGuidedSessions: [],
    completedSessions: [],
    completedGuidedSessionsByInstrument: {}
  };
}

function setupBridge() {
  global.window = global;
  global.S = freshS();
  global.clone = function(o) { return JSON.parse(JSON.stringify(o)); };
  global.SparkChordProgress = { add: function() {} };
  global.saveState = function() {};
  eval(loadJS("js/sparksuite/bridges/progress_bridge.js"));
}

function setupCurriculum() {
  global.window = global;
  eval(loadJS("js/curriculum/curriculum_engine.js"));
}

// ── ProgressBridge tests ──

test("applySessionStatePatch without instrumentKey writes only to global field", function() {
  setupBridge();
  SparkProgressBridge.applySessionStatePatch({ guided: { completedSessionNums: [1] } });
  assert.deepStrictEqual(S.completedGuidedSessions, [1]);
  assert.deepStrictEqual(S.completedGuidedSessionsByInstrument, {}, "per-instrument should be empty");
});

test("applySessionStatePatch with instrumentKey writes to both global and per-instrument field", function() {
  setupBridge();
  SparkProgressBridge.applySessionStatePatch({ guided: { instrumentKey: "guitar", completedSessionNums: [1] } });
  assert.ok(S.completedGuidedSessions.indexOf(1) >= 0, "global field must still contain num");
  assert.deepStrictEqual(S.completedGuidedSessionsByInstrument["guitar"], [1]);
});

test("guitar session 1 completion does not mark piano session 1 complete in per-instrument field", function() {
  setupBridge();
  SparkProgressBridge.applySessionStatePatch({ guided: { instrumentKey: "guitar", completedSessionNums: [1] } });
  assert.deepStrictEqual(S.completedGuidedSessionsByInstrument["guitar"], [1]);
  assert.strictEqual(S.completedGuidedSessionsByInstrument["piano"], undefined, "piano must be untouched");
});

test("piano and guitar can independently complete session 1 without collision", function() {
  setupBridge();
  SparkProgressBridge.applySessionStatePatch({ guided: { instrumentKey: "guitar", completedSessionNums: [1] } });
  SparkProgressBridge.applySessionStatePatch({ guided: { instrumentKey: "piano", completedSessionNums: [1] } });
  assert.deepStrictEqual(S.completedGuidedSessionsByInstrument["guitar"], [1]);
  assert.deepStrictEqual(S.completedGuidedSessionsByInstrument["piano"], [1]);
});

test("duplicate completions are not pushed twice into per-instrument field", function() {
  setupBridge();
  SparkProgressBridge.applySessionStatePatch({ guided: { instrumentKey: "bass", completedSessionNums: [2] } });
  SparkProgressBridge.applySessionStatePatch({ guided: { instrumentKey: "bass", completedSessionNums: [2] } });
  assert.strictEqual(S.completedGuidedSessionsByInstrument["bass"].length, 1, "should dedup");
});

// ── CurriculumEngine.getNextGuidedSession per-instrument scoping ──

function makeSessions(nums) {
  return nums.map(function(n) { return { num: n, title: "Session " + n }; });
}

test("getNextGuidedSession with instrumentKey reads per-instrument completions", function() {
  global.S = freshS();
  S.completedGuidedSessionsByInstrument["guitar"] = [1, 2];
  setupCurriculum();
  var sessions = makeSessions([1, 2, 3]);
  var result = SparkCurriculumService.getNextGuidedSession(sessions, { instrumentKey: "guitar" });
  assert.ok(result, "should return a result");
  assert.strictEqual(result.sessionNum, 3, "guitar has done 1+2 so next is 3");
  assert.strictEqual(result.allComplete, false);
});

test("getNextGuidedSession with different instrument key sees independent completion set", function() {
  global.S = freshS();
  S.completedGuidedSessionsByInstrument["guitar"] = [1, 2, 3];
  setupCurriculum();
  var sessions = makeSessions([1, 2, 3]);
  var result = SparkCurriculumService.getNextGuidedSession(sessions, { instrumentKey: "piano" });
  assert.ok(result, "piano has no completions so should return session 1");
  assert.strictEqual(result.sessionNum, 1);
});

test("getNextGuidedSession falls back to legacy global when no per-instrument data exists", function() {
  global.S = freshS();
  S.completedGuidedSessions = [1];
  setupCurriculum();
  var sessions = makeSessions([1, 2]);
  var result = SparkCurriculumService.getNextGuidedSession(sessions, { instrumentKey: "guitar" });
  assert.strictEqual(result.sessionNum, 2, "should skip 1 found in legacy global");
});

test("getNextGuidedSession returns allComplete:true when all sessions done per-instrument", function() {
  global.S = freshS();
  S.completedGuidedSessionsByInstrument["bass"] = [1, 2];
  setupCurriculum();
  var sessions = makeSessions([1, 2]);
  var result = SparkCurriculumService.getNextGuidedSession(sessions, { instrumentKey: "bass" });
  assert.strictEqual(result.allComplete, true);
});

if (process.exitCode) process.exit(process.exitCode);
