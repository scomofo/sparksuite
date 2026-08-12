var assert = require("assert");
var fs = require("fs");
var path = require("path");

global.window = global;
require("vm").runInThisContext(fs.readFileSync(path.join(__dirname, "..", "js/sparksuite/domain/note_event.js"), "utf8"), { filename: path.join(__dirname, "..", "js/sparksuite/domain/note_event.js") });

function test(name, fn) {
  try { fn(); console.log("  PASS: " + name); }
  catch (e) { console.error("  FAIL: " + name + "\n    " + e.message); process.exitCode = 1; }
}

console.log("\n--- SparkNoteEvent lane property ---");

test("lane is stored when provided", function() {
  var evt = new SparkNoteEvent({ lane: 3, tick: 0, laneMask: 0x08 });
  assert.strictEqual(evt.lane, 3);
});

test("lane 0 is stored correctly (not confused with falsy)", function() {
  var evt = new SparkNoteEvent({ lane: 0, tick: 0 });
  assert.strictEqual(evt.lane, 0);
});

test("lane is null when not provided", function() {
  var evt = new SparkNoteEvent({ tick: 0, laneMask: 0x04 });
  assert.strictEqual(evt.lane, null);
});

test("laneMask is still stored independently of lane", function() {
  var evt = new SparkNoteEvent({ lane: 2, laneMask: 0x04 });
  assert.strictEqual(evt.lane, 2);
  assert.strictEqual(evt.laneMask, 0x04);
});

test("lane stored from constructor does not corrupt other fields", function() {
  var evt = new SparkNoteEvent({ lane: 4, tick: 100, tickLength: 48, difficulty: "hard" });
  assert.strictEqual(evt.tick, 100);
  assert.strictEqual(evt.tickLength, 48);
  assert.strictEqual(evt.difficulty, "hard");
  assert.strictEqual(evt.lane, 4);
});
