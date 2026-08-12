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
}

function test(name, fn) {
  try {
    resetEnvironment();
    loadVM("js/instruments/piano/pages/editor.js");
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.stack);
    process.exitCode = 1;
  }
}

function sourceStringLiterals(source) {
  var matches = source.match(/(["'`])(?:\\[\s\S]|(?!\1)[^\\])*\1/g) || [];
  return matches.map(function(match) { return match.slice(1, -1); });
}

console.log("\n--- Piano Editor Page Resolution ---");

test("pianoEditorPage ignores stale metadata and item labels", function() {
  var html = pianoEditorPage();
  assert.ok(html.indexOf("song chart 1") >= 0);
  assert.ok(html.indexOf('<span class="metric-label">Mode:</span>') >= 0);
  assert.ok(/class="metric-value"[^>]*>chart<\/span>/.test(html));
  assert.ok(html.indexOf("value=\"song chart 1\"") >= 0);
  assert.ok(html.indexOf("value=\"null\"") === -1);
  assert.ok(html.indexOf("undefined @ 1.5") === -1);
  assert.ok(html.indexOf("event @ 1.5") >= 0);
  assert.ok(html.indexOf("event · event") >= 0);
  assert.ok(html.indexOf("editorSelect','undefined") === -1);
  assert.ok(html.indexOf("null · 0 → 4") === -1);
  assert.ok(html.indexOf("phrase · 0 → 4") >= 0);
  assert.ok(html.indexOf(">C4<") >= 0);
  assert.ok(html.indexOf("Grid: 1/4") >= 0);
});

test("pianoEditorPage ignores malformed playhead and item timing values", function() {
  global.S.editorPlayheadSec = "NaN";
  global.S.editorObject.events[0].t = "NaN";
  global.S.editorObject.phrases[0].startSec = "NaN";
  global.S.editorObject.phrases[0].endSec = { broken: true };

  var html = pianoEditorPage();

  assert.ok(html.indexOf("Playhead: 0.00s") >= 0);
  assert.ok(html.indexOf("event @ 0") >= 0);
  assert.ok(html.indexOf("phrase") >= 0);
  assert.ok(html.indexOf("0 → 0") >= 0 || html.indexOf("0 â†’ 0") >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

test("pianoEditorPage ignores malformed BPM values", function() {
  global.S.editorObject.bpm = "NaN";

  var html = pianoEditorPage();

  assert.ok(html.indexOf('type="number" value="80"') >= 0);
  assert.ok(html.indexOf("NaN") === -1);
});

test("pianoEditorPage uses shared visual contract classes", function() {
  var html = pianoEditorPage();
  var source = loadJS("js/instruments/piano/pages/editor.js");

  assert.strictEqual(html.indexOf("<b>"), -1);
  assert.strictEqual(sourceStringLiterals(source).some(function(value) { return value.indexOf("<b>") >= 0; }), false);
  assert.ok(html.indexOf('class="card-section-heading mb8"') >= 0);
  assert.ok(html.indexOf('class="card-micro-heading"') >= 0);
  assert.ok(html.indexOf('class="metric-label"') >= 0);
  assert.ok(html.indexOf('class="metric-value"') >= 0);
  assert.ok(html.indexOf('class="action-row"') >= 0);
});

if (process.exitCode) process.exit(process.exitCode);
