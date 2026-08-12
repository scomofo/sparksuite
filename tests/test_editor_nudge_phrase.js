var assert = require("assert");
var fs = require("fs");
var path = require("path");

global.window = global;
global.S = { editorGridDivision: "1/4", editorDirty: false, editorObject: { events: [], phrases: [], steps: [] } };

// Minimal stubs for transforms.js dependencies
global.getSelectedEditorItems = function() { return global._mockItems || []; };
global.getEditorBpm = function() { return 120; };
global.getGridStepSec = function(div, bpm) {
  // 1/4 note at 120 BPM = 0.5s; 1/1 = 2s; 1/2 = 1s
  var beats = { "1/1": 4, "1/2": 2, "1/4": 1, "1/8": 0.5 };
  return (beats[div] || 1) * (60 / bpm);
};
global.snapPhraseBounds = function(item) { /* no-op in tests */ };
global.snapTimeSec = function(t) { return t; };
global.markEditorCheckpoint = function() {};
global.addEditorItem = function() {};
global.clearEditorSelection = function() {};
global.removeEditorItem = function() {};

require("vm").runInThisContext(fs.readFileSync(path.join(__dirname, "..", "js/editor/transforms.js"), "utf8"), { filename: path.join(__dirname, "..", "js/editor/transforms.js") });

function test(name, fn) {
  try { fn(); console.log("  PASS: " + name); }
  catch (e) { console.error("  FAIL: " + name + "\n    " + e.message); process.exitCode = 1; }
}

function makePhrase(startSec, endSec, id) {
  return { id: id || "p1", startSec: startSec, endSec: endSec };
}

console.log("\n--- nudgeSelectedEditorGroup phrase duration preservation ---");

test("nudge left preserves phrase duration (non-clamped case)", function() {
  var phrase = makePhrase(2.0, 3.5);
  global.S.editorObject = { events: [], phrases: [phrase], steps: [] };
  global._mockItems = [phrase];
  global.S.editorGridDivision = "1/4"; // step = 0.5s at 120 BPM
  nudgeSelectedEditorGroup("left");
  var dur = phrase.endSec - phrase.startSec;
  assert.ok(Math.abs(dur - 1.5) < 1e-6, "duration should remain 1.5s, got " + dur);
  assert.ok(Math.abs(phrase.startSec - 1.5) < 1e-6, "startSec should be 1.5, got " + phrase.startSec);
});

test("nudge left clamped at 0 still preserves phrase duration", function() {
  var phrase = makePhrase(0.3, 1.8); // 1.5s duration, startSec < 1 step
  global.S.editorObject = { events: [], phrases: [phrase], steps: [] };
  global._mockItems = [phrase];
  global.S.editorGridDivision = "1/1"; // step = 2s at 120 BPM → clamp to 0
  nudgeSelectedEditorGroup("left");
  var dur = phrase.endSec - phrase.startSec;
  assert.ok(Math.abs(dur - 1.5) < 1e-6, "duration should remain 1.5s after clamped left nudge, got " + dur);
  assert.strictEqual(phrase.startSec, 0, "startSec should be clamped to 0");
  assert.ok(Math.abs(phrase.endSec - 1.5) < 1e-6, "endSec should be 1.5, got " + phrase.endSec);
});

test("nudge right preserves phrase duration", function() {
  var phrase = makePhrase(1.0, 2.5);
  global.S.editorObject = { events: [], phrases: [phrase], steps: [] };
  global._mockItems = [phrase];
  global.S.editorGridDivision = "1/4"; // step = 0.5s
  nudgeSelectedEditorGroup("right");
  var dur = phrase.endSec - phrase.startSec;
  assert.ok(Math.abs(dur - 1.5) < 1e-6, "duration should remain 1.5s, got " + dur);
  assert.ok(Math.abs(phrase.startSec - 1.5) < 1e-6, "startSec should be 1.5, got " + phrase.startSec);
});

test("nudge left from startSec=0 does not produce negative endSec", function() {
  var phrase = makePhrase(0, 0.5);
  global.S.editorObject = { events: [], phrases: [phrase], steps: [] };
  global._mockItems = [phrase];
  global.S.editorGridDivision = "1/1"; // step = 2s → fully clamped
  nudgeSelectedEditorGroup("left");
  assert.ok(phrase.startSec >= 0, "startSec must not go negative");
  assert.ok(phrase.endSec >= 0, "endSec must not go negative");
  assert.ok(phrase.endSec >= phrase.startSec, "endSec must not be less than startSec");
});
