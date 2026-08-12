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

function resetEnvironment() {
  global.window = global;
  global.escHTML = function(value) { return String(value == null ? "" : value); };
  global.S = {
    editorSelectedId: "evt_1",
    editorObject: {
      events: [
        {
          id: "evt_1",
          t: 1.5,
          dur: 0.5,
          type: "undefined",
          performance: { laneLabel: "null" },
          target: { chordShort: "NaN", note: "undefined", midi: 64 }
        }
      ],
      phrases: [
        { id: "phrase_1", name: "undefined", startSec: 0, endSec: 4 }
      ],
      steps: [
        { id: "step_1", chord: "null", note: "C4", dur: 1 }
      ]
    }
  };
  global.act = function() {};
}

function test(name, fn) {
  try {
    resetEnvironment();
    loadVM("js/editor/inspector.js");
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.stack);
    process.exitCode = 1;
  }
}

console.log("\n--- Editor Inspector Resolution ---");

test("renderEditorInspector ignores stale event field text", function() {
  var html = renderEditorInspector();
  assert.ok(html.indexOf('value="undefined"') === -1);
  assert.ok(html.indexOf('value="null"') === -1);
  assert.ok(html.indexOf('value="NaN"') === -1);
  assert.ok(html.indexOf('value="64"') >= 0);
});

test("renderEditorInspector ignores stale phrase and step field text", function() {
  S.editorSelectedId = "phrase_1";
  var phraseHtml = renderEditorInspector();
  assert.ok(phraseHtml.indexOf('value="undefined"') === -1);

  S.editorSelectedId = "step_1";
  var stepHtml = renderEditorInspector();
  assert.ok(stepHtml.indexOf('value="null"') === -1);
  assert.ok(stepHtml.indexOf('value="C4"') >= 0);
});

if (process.exitCode) process.exit(process.exitCode);
