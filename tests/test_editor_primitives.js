// ===== Editor Primitives Tests =====
// Run: node tests/test_editor_primitives.js
//
// Behavioral coverage for the pure-logic editor modules:
// grid.js (BPM/grid math), snapping.js (snap + nudge), history.js
// (undo/redo stacks, transactions, history cap), and hit_test.js
// (pointer-to-time/lane mapping and item targeting).

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    resetState();
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

function loadJS(file) {
  var full = path.join(__dirname, "..", file);
  vm.runInThisContext(fs.readFileSync(full, "utf8"), { filename: full });
}

function resetState() {
  global.window = global;
  global.S = {
    editorObject: { bpm: 120, events: [], phrases: [] },
    editorSnapEnabled: true,
    editorGridDivision: "1/4",
    editorSelectedId: null,
    editorSelectionIds: [],
    editorUndoStack: [],
    editorRedoStack: [],
    editorTransaction: null,
    editorViewportPxPerSec: 100,
    editorLaneHeightPx: 50
  };
  // Seams owned by other editor modules, stubbed at the module boundary.
  global.getEditorTimelineRange = function() { return { startSec: 0, endSec: 60 }; };
  global.getLaneIndexForItem = function(item) { return item.lane || 0; };
  global.getEditorLanes = function() { return [{}, {}, {}]; };
}

resetState();
loadJS("js/editor/grid.js");
loadJS("js/editor/snapping.js");
loadJS("js/editor/history.js");
loadJS("js/editor/hit_test.js");

console.log("=== Editor Primitives Tests ===");

test("grid step follows the division at the editor BPM", function() {
  // 120 bpm -> 0.5s per beat
  assert.strictEqual(getEditorBpm(), 120);
  assert.strictEqual(getGridStepSec("1/4", 120), 0.5);
  assert.strictEqual(getGridStepSec("1/1", 120), 2);
  assert.strictEqual(getGridStepSec("1/8", 120), 0.25);
  assert.strictEqual(getGridStepSec("1/16", 120), 0.125);
  assert.strictEqual(getGridStepSec("bogus", 120), 0.5, "unknown division falls back to one beat");
});

test("grid BPM falls back to 80 without an editor object", function() {
  S.editorObject = null;
  assert.strictEqual(getEditorBpm(), 80);
});

test("grid lines span the window with bar/beat labels", function() {
  var lines = buildTimelineGridLines(0, 2, 120, "1/4");
  assert.strictEqual(lines.length, 5); // 0, .5, 1, 1.5, 2
  assert.strictEqual(lines[0].label, "Bar 1 · Beat 1");
  assert.strictEqual(lines[4].label, "Bar 2 · Beat 1");
});

test("snapTimeSec rounds to the active grid", function() {
  assert.strictEqual(snapTimeSec(0.6, 120, "1/4"), 0.5);
  assert.strictEqual(snapTimeSec(0.76, 120, "1/4"), 1);
  assert.strictEqual(snapTimeSec(0.6, 120, "1/8"), 0.5);
});

test("snapTimeSec is a pass-through when snapping is disabled", function() {
  S.editorSnapEnabled = false;
  assert.strictEqual(snapTimeSec(0.6, 120, "1/4"), 0.6);
});

test("nudgeTimeSec moves one grid step and clamps at zero", function() {
  assert.strictEqual(nudgeTimeSec(1, "right", 120, "1/4"), 1.5);
  assert.strictEqual(nudgeTimeSec(1, "left", 120, "1/4"), 0.5);
  assert.strictEqual(nudgeTimeSec(0.2, "left", 120, "1/4"), 0, "never nudges before zero");
  assert.strictEqual(nudgeTimeSec(1, "nowhere", 120, "1/4"), 1);
});

test("snapPhraseBounds snaps both edges and keeps end >= start", function() {
  var phrase = { startSec: 0.6, endSec: 0.7 };
  snapPhraseBounds(phrase);
  assert.strictEqual(phrase.startSec, 0.5);
  assert.strictEqual(phrase.endSec, 0.5);
  assert.strictEqual(snapPhraseBounds(null), null);
});

test("checkpoint + undo restores the previous editor object", function() {
  S.editorObject = { bpm: 120, title: "before" };
  markEditorCheckpoint("edit");
  S.editorObject = { bpm: 120, title: "after" };
  assert.strictEqual(undoEditorChange(), true);
  assert.strictEqual(S.editorObject.title, "before");
  assert.strictEqual(S.editorDirty, true);
});

test("redo replays an undone change", function() {
  S.editorObject = { bpm: 120, title: "v1" };
  markEditorCheckpoint();
  S.editorObject = { bpm: 120, title: "v2" };
  undoEditorChange();
  assert.strictEqual(S.editorObject.title, "v1");
  assert.strictEqual(redoEditorChange(), true);
  assert.strictEqual(S.editorObject.title, "v2");
});

test("undo restores the selection captured with the entry", function() {
  S.editorObject = { bpm: 120, notes: [1] };
  S.editorSelectedId = "n1";
  S.editorSelectionIds = ["n1", "n2"];
  markEditorCheckpoint();
  S.editorObject = { bpm: 120, notes: [] };
  S.editorSelectedId = null;
  S.editorSelectionIds = [];
  undoEditorChange();
  assert.strictEqual(S.editorSelectedId, "n1");
  assert.deepStrictEqual(S.editorSelectionIds, ["n1", "n2"]);
  assert.strictEqual(S.editorPrimarySelectionId, "n1");
});

test("undo and redo refuse to run on empty stacks", function() {
  assert.strictEqual(undoEditorChange(), false);
  assert.strictEqual(redoEditorChange(), false);
});

test("a new checkpoint clears the redo stack", function() {
  S.editorObject = { bpm: 120, title: "a" };
  markEditorCheckpoint();
  S.editorObject = { bpm: 120, title: "b" };
  undoEditorChange();
  assert.strictEqual(S.editorRedoStack.length, 1);
  markEditorCheckpoint();
  assert.strictEqual(S.editorRedoStack.length, 0, "checkpoint must invalidate redo");
});

test("history is capped at the configured limit, keeping newest entries", function() {
  S.editorHistoryLimit = 5;
  for (var i = 0; i < 10; i++) {
    S.editorObject = { bpm: 120, rev: i };
    markEditorCheckpoint("rev" + i);
  }
  assert.strictEqual(S.editorUndoStack.length, 5);
  assert.strictEqual(S.editorUndoStack[4].object.rev, 9, "newest entry survives the cap");
  assert.strictEqual(S.editorUndoStack[0].object.rev, 5, "oldest entries are dropped");
});

test("a transaction commits one undo entry only when something changed", function() {
  S.editorObject = { bpm: 120, title: "start" };
  assert.strictEqual(beginEditorTransaction("Move"), true);
  S.editorObject.title = "moved";
  assert.strictEqual(commitEditorTransaction("Move"), true);
  assert.strictEqual(S.editorUndoStack.length, 1);
  assert.strictEqual(S.editorUndoStack[0].object.title, "start", "undo entry holds pre-transaction state");
  assert.strictEqual(S.editorTransaction, null);
});

test("a no-op transaction commits nothing", function() {
  S.editorObject = { bpm: 120, title: "same" };
  beginEditorTransaction("Noop");
  assert.strictEqual(commitEditorTransaction("Noop"), false);
  assert.strictEqual(S.editorUndoStack.length, 0);
});

test("cancelling a transaction leaves no history", function() {
  S.editorObject = { bpm: 120 };
  beginEditorTransaction("Abort");
  S.editorObject.bpm = 90;
  assert.strictEqual(cancelEditorTransaction(), true);
  assert.strictEqual(S.editorTransaction, null);
  assert.strictEqual(S.editorUndoStack.length, 0);
});

test("transactions require an editor object", function() {
  S.editorObject = null;
  assert.strictEqual(beginEditorTransaction("x"), false);
  assert.strictEqual(commitEditorTransaction("x"), false);
  assert.strictEqual(markEditorCheckpoint(), false);
});

test("pixel mapping round-trips time and lane coordinates", function() {
  assert.strictEqual(timeToEditorX(2), 200);
  assert.strictEqual(editorXToTime(200), 2);
  assert.strictEqual(laneIndexToEditorY(2), 100);
  assert.strictEqual(editorYToLaneIndex(100), 2);
  assert.strictEqual(editorYToLaneIndex(-10), 0, "lane index never negative");
});

test("hit testing returns the item under the pointer", function() {
  var obj = {
    events: [
      { id: "e1", t: 1, dur: 0.5, lane: 0 },
      { id: "e2", t: 3, dur: 0.5, lane: 1 }
    ],
    phrases: []
  };
  // e2 occupies x 300..350, lane 1 -> y 56..94 (laneHeight 50, inset 6)
  var hit = getHitTargetAtPoint(310, 70, obj);
  assert.strictEqual(hit.kind, "event");
  assert.strictEqual(hit.id, "e2");
});

test("hit testing falls back to the nearest item outside all bounds", function() {
  var obj = {
    events: [
      { id: "near", t: 1, dur: 0.25, lane: 0 },
      { id: "far", t: 10, dur: 0.25, lane: 0 }
    ],
    phrases: []
  };
  var hit = getHitTargetAtPoint(140, 25, obj);
  assert.strictEqual(hit.id, "near");
  assert.strictEqual(getHitTargetAtPoint(0, 0, null), null);
});

test("phrase bounds span all lanes", function() {
  var obj = {
    events: [],
    phrases: [{ id: "p1", startSec: 1, endSec: 3 }]
  };
  var bounds = getEditorItemBounds("phrase", obj.phrases[0], obj);
  assert.strictEqual(bounds.x, 100);
  assert.strictEqual(bounds.w, 200);
  assert.strictEqual(bounds.h, 150, "phrase covers lanes * laneHeight");
  var hit = getHitTargetAtPoint(150, 120, obj);
  assert.strictEqual(hit.kind, "phrase");
  assert.strictEqual(hit.id, "p1");
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
