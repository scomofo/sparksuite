var assert = require("assert");
var fs = require("fs");
var path = require("path");

global.window = global;

function test(name, fn) {
  try { fn(); console.log("  PASS: " + name); }
  catch (e) { console.error("  FAIL: " + name + "\n    " + e.message); process.exitCode = 1; }
}

console.log("\n--- applyMidiProfileToNote noteRange guard ---");

test("no crash when profile is missing noteRange (accepts note in default range)", function() {
  global.getActiveMidiProfile = function() { return {}; }; // no noteRange
  global.eval(fs.readFileSync(path.join(__dirname, "..", "js/midi/mapping.js"), "utf8"));
  var result;
  assert.doesNotThrow(function() {
    result = applyMidiProfileToNote(60, 1, 80);
  }, "must not throw TypeError when noteRange is absent");
  assert.strictEqual(result.accepted, true, "note 60 should be accepted against default [0,127]");
});

test("note below default range is rejected when noteRange missing", function() {
  global.getActiveMidiProfile = function() { return {}; };
  var result = applyMidiProfileToNote(-1, 1, 80);
  assert.strictEqual(result.accepted, false);
});

test("note above default range is rejected when noteRange missing", function() {
  global.getActiveMidiProfile = function() { return {}; };
  var result = applyMidiProfileToNote(128, 1, 80);
  assert.strictEqual(result.accepted, false);
});

test("explicit noteRange in profile still works correctly", function() {
  global.getActiveMidiProfile = function() { return { noteRange: { min: 48, max: 72 } }; };
  assert.strictEqual(applyMidiProfileToNote(47, 1, 80).accepted, false);
  assert.strictEqual(applyMidiProfileToNote(48, 1, 80).accepted, true);
  assert.strictEqual(applyMidiProfileToNote(72, 1, 80).accepted, true);
  assert.strictEqual(applyMidiProfileToNote(73, 1, 80).accepted, false);
});

test("null profile bypasses noteRange check entirely", function() {
  global.getActiveMidiProfile = function() { return null; };
  var result = applyMidiProfileToNote(60, 1, 80);
  assert.strictEqual(result.accepted, true);
});
