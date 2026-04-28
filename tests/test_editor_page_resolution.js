var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

// Load shared SparkNormalize helper used by page modules below.
// js/utils/normalize.js attaches to window.SparkNormalize, so bootstrap
// the window alias first (resetEnv() also sets it but runs per-test).
global.window = global.window || global;
var _testEval = eval;
_testEval(loadJS("js/utils/normalize.js"));


function resetEnvironment() {
  global.window = global;
  global.escHTML = function(value) { return String(value == null ? "" : value); };
  global.act = function() {};
  global.S = {
    editorMode: "undefined",
    editorDirty: false,
    editorSelectedId: "evt_1",
    editorPlayheadSec: 0,
    editorGridDivision: "null",
    editorSnapEnabled: true,
    editorObject: {
      id: "song_chart_1",
      title: "undefined",
      artist: "null",
      bpm: 92,
      events: [
        { id: "undefined", type: "undefined", t: 1.5 }
      ],
      phrases: [
        { id: "phrase_1", name: "null", startSec: 0, endSec: 4 }
      ],
      steps: [
        { id: "step_1", chord: "undefined", note: "C4", type: "null" }
      ]
    }
  };
  global.validateEditorObject = function() { return []; };
  global.renderVisualTimeline = function() { return "<div>timeline</div>"; };
  global.renderEditorInspector = function() { return "<div>inspector</div>"; };
  delete global.getEditorTimelineRange;
  delete global.getEditorBpm;
  delete global.buildTimelineGridLines;
}

function test(name, fn) {
  try {
    resetEnvironment();
    global.eval(loadJS("js/pages/editor.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.stack);
    process.exitCode = 1;
  }
}

console.log("\n--- Editor Page Resolution ---");

test("editorPage ignores stale metadata and item labels", function() {
  var html = editorPage();
  assert.ok(html.indexOf("song_chart_1") >= 0);
  assert.ok(html.indexOf("Mode:</b> chart") >= 0);
  assert.ok(html.indexOf("value=\"song_chart_1\"") >= 0);
  assert.ok(html.indexOf("value=\"null\"") === -1);
  assert.ok(html.indexOf("undefined @ 1.5") === -1);
  assert.ok(html.indexOf("event @ 1.5") >= 0);
  assert.ok(html.indexOf("event · event") >= 0);
  assert.ok(html.indexOf("editorSelect','undefined") === -1);
  assert.ok(html.indexOf("null · 0 → 4") === -1);
  assert.ok(html.indexOf("phrase · 0 → 4") >= 0);
  assert.ok(html.indexOf(">C4<") >= 0);
});

test("editorPage ignores malformed bpm values", function() {
  S.editorObject.bpm = "NaN";

  var html = editorPage();

  assert.ok(html.indexOf('type="number" value="80"') >= 0);
  assert.ok(html.indexOf('type="number" value="NaN"') === -1);
});

test("editorPage ignores malformed timeline numbers", function() {
  S.editorPlayheadSec = "NaN";
  global.renderVisualTimeline = null;
  global.buildTimelineGridLines = function() {
    return [{ label: "Beat 1", t: "NaN" }];
  };

  var html = editorPage();

  assert.ok(html.indexOf("Playhead: 0.00s") >= 0);
  assert.ok(html.indexOf("Beat 1 (0.00s)") >= 0);
  assert.ok(html.indexOf("NaNs") === -1);
});

test("editor surfaces expose keyboard handlers for selectable rows", function() {
  var source = loadJS("js/pages/editor.js");
  assert.ok(source.indexOf('role="button" tabindex="0" onclick="act(\\\'editorSelect\\\',') >= 0);
});

test("editorPage renders when optional validator is not loaded", function() {
  delete global.validateEditorObject;

  var html = editorPage();

  assert.ok(html.indexOf("<h2>Editor</h2>") >= 0);
  assert.ok(html.indexOf("Validation") === -1);
});

if (process.exitCode) process.exit(process.exitCode);
