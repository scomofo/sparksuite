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

// Load shared SparkNormalize helper used by page modules below.
// js/utils/normalize.js attaches to window.SparkNormalize, so bootstrap
// the window alias first (resetEnv() also sets it but runs per-test).
global.window = global.window || global;
var _testEval = eval;
_testEval(loadJS("js/utils/normalize.js"));


function resetEnvironment() {
  global.window = global;
  global.S = {
    performEditorChart: null,
    performEditorLibrary: []
  };
  global.escHTML = function(value) { return String(value); };
  global.act = function() {};
}

function test(name, fn) {
  try {
    resetEnvironment();
    loadVM("js/pages/performance_editor.js");
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Performance Editor Page Resolution ---");

test("performanceEditorPage ignores stale active chart and event text tokens", function() {
  S.performEditorLibrary = [{
    id: "saved_chart_1",
    title: "undefined",
    arrangementType: "null",
    events: [{ id: 1 }]
  }];
  S.performEditorChart = {
    id: "editor_chart_1",
    title: "undefined",
    bpm: 120,
    events: [{
      id: 7,
      laneLabel: "undefined",
      chord: "null",
      note: "NaN",
      t: 1,
      dur: 0.5
    }],
    phrases: [{
      id: 3,
      name: "undefined",
      startSec: 0,
      endSec: 4
    }]
  };
  global.sparkCore = {
    getPerformanceEditorDocumentView: function() {
      return {
        chart: S.performEditorChart,
        library: S.performEditorLibrary,
        title: "undefined",
        source: "null",
        dirty: false,
        mode: "chords",
        snap: "1/8",
        selectedEventId: 7,
        selectedEventLabel: "undefined",
        selectedEventTime: 1,
        selectedEventDuration: 0.5,
        selectedPhraseId: 3,
        selectedPhraseName: "null"
      };
    },
    getActiveSessionView: function() {
      return { runtimeState: {} };
    }
  };

  var html = performanceEditorPage();
  assert.ok(html.indexOf("Untitled") >= 0);
  assert.ok(html.indexOf("blank") >= 0);
  assert.ok(html.indexOf(">undefined<") === -1);
  assert.ok(html.indexOf(">null<") === -1);
  assert.ok(html.indexOf(">NaN<") === -1);
  assert.ok(html.indexOf('value="editor_chart_1"') >= 0);
  assert.ok(html.indexOf(">Phrase 1<") >= 0);
  assert.ok(html.indexOf(">?<") >= 0);
});

test("performanceEditorPage ignores stale saved chart library text tokens", function() {
  S.performEditorChart = null;
  S.performEditorLibrary = [{
    id: "saved_chart_1",
    title: "undefined",
    arrangementType: "null",
    events: [{ id: 1 }]
  }];
  global.sparkCore = {
    getPerformanceEditorDocumentView: function() {
      return {
        chart: null,
        library: S.performEditorLibrary,
        source: "null",
        dirty: false,
        mode: "chords",
        snap: "1/8"
      };
    },
    getActiveSessionView: function() {
      return { runtimeState: {} };
    }
  };

  var html = performanceEditorPage();
  assert.ok(html.indexOf("saved_chart_1") >= 0);
  assert.ok(html.indexOf(">null<") === -1);
  assert.ok(html.indexOf(">undefined<") === -1);
});

test("performanceEditorPage ignores malformed numeric editor values", function() {
  S.performEditorChart = {
    id: "editor_chart_2",
    title: "Chart",
    bpm: "NaN",
    events: [{
      id: 9,
      laneLabel: "C",
      t: "NaN",
      dur: "NaN"
    }],
    phrases: [{
      id: 4,
      name: "Phrase",
      startSec: "NaN",
      endSec: "NaN"
    }]
  };
  global.sparkCore = {
    getPerformanceEditorDocumentView: function() {
      return {
        chart: S.performEditorChart,
        library: [],
        source: "existing",
        dirty: false,
        mode: "chords",
        snap: "1/8",
        bpm: "NaN",
        selectedEventId: 9,
        selectedEventTime: "NaN",
        selectedEventDuration: "NaN",
        selectedPhraseId: 4,
        selectedPhraseStart: "NaN",
        selectedPhraseEnd: "NaN"
      };
    },
    getActiveSessionView: function() {
      return { runtimeState: {} };
    }
  };

  var html = performanceEditorPage();
  assert.ok(html.indexOf('value="90"') >= 0);
  assert.ok(html.indexOf('value="NaN"') === -1);
  assert.ok(html.indexOf("0.0s - 0.0s") >= 0);
  assert.ok(html.indexOf("0.00s / 0.00s") >= 0);
});

test("performanceEditorPage can resolve sparkCore from the global binding", function() {
  global.window = {};
  global.S.performEditorChart = {
    id: "global_editor_chart",
    title: "Global Groove",
    bpm: 108,
    events: [{ id: 5, laneLabel: "A", t: 1.25, dur: 0.75 }],
    phrases: []
  };
  global.S.performEditorLibrary = [];
  global.sparkCore = {
    getPerformanceEditorDocumentView: function() {
      return {
        chart: global.S.performEditorChart,
        library: global.S.performEditorLibrary,
        title: "Global Groove",
        source: "runtime",
        dirty: true,
        mode: "lead",
        snap: "free"
      };
    },
    getActiveSessionView: function() {
      return {
        runtimeState: {
          performanceEditorMode: "lead",
          performanceEditorSnap: "free",
          performanceEditorDirty: true
        }
      };
    }
  };

  loadVM("js/pages/performance_editor.js");

  var html = performanceEditorPage();
  assert.ok(html.indexOf("Global Groove | runtime | 1 events") >= 0);
  assert.ok(html.indexOf("unsaved") >= 0);
  assert.ok(html.indexOf('onclick="act(\'editorMode\',\'lead\')"') >= 0);
  assert.ok(html.indexOf('onclick="act(\'editorSnap\',\'free\')"') >= 0);
});

test("performance editor event rows expose keyboard handlers", function() {
  var source = loadJS("js/pages/performance_editor.js");
  assert.ok(source.indexOf('role="button" tabindex="0" onclick="if(event.target&&event.target.closest&&event.target.closest(\\\'button,input,select,textarea,a\\\')){return;}act(\\\'editorSelectEvent\\\',') >= 0);
  assert.ok(source.indexOf('role="button" tabindex="0" style="cursor:pointer;margin-top:8px" onclick="if(event.target&&event.target.closest&&event.target.closest(\\\'button,input,select,textarea,a\\\')){return;}act(\\\'editorLoad\\\',') >= 0);
  assert.ok(source.indexOf('class="split-row" role="button" tabindex="0" style="padding:3px 6px;font-size:12px;border-radius:6px;cursor:pointer;background:') >= 0);
  assert.ok(source.indexOf('onclick="act(\\\'editorSelectPhrase\\\',') >= 0);
  assert.strictEqual(source.indexOf("event.stopPropagation();act('editorDelete'"), -1);
  assert.strictEqual(source.indexOf("event.stopPropagation();act('editorDeleteEvent'"), -1);
});

test("performanceEditorPage uses shared visual contract classes", function() {
  global.S.performEditorChart = {
    id: "editor_chart_3",
    title: "Chart",
    bpm: 112,
    events: [{ id: 11, laneLabel: "C", t: 1, dur: 0.5 }],
    phrases: [{ id: 5, name: "Intro", startSec: 0, endSec: 2 }]
  };
  global.sparkCore = {
    getPerformanceEditorDocumentView: function() {
      return {
        chart: global.S.performEditorChart,
        library: [],
        source: "existing",
        dirty: true,
        mode: "chords",
        snap: "1/8",
        selectedEventId: 11,
        selectedPhraseId: 5
      };
    },
    getActiveSessionView: function() {
      return { runtimeState: {} };
    }
  };

  var html = performanceEditorPage();
  var source = loadJS("js/pages/performance_editor.js");

  assert.ok(html.indexOf('class="card-section-heading"') >= 0);
  assert.ok(html.indexOf('class="card-micro-heading"') >= 0);
  assert.ok(html.indexOf('class="metric-label"') >= 0);
  assert.ok(html.indexOf('class="metric-value"') >= 0);
  assert.ok(html.indexOf('class="split-row"') >= 0);
  assert.ok(html.indexOf('class="action-row"') >= 0);
  assert.strictEqual(source.indexOf("display:flex;justify-content:space-between;align-items:center"), -1);
});

if (process.exitCode) process.exit(process.exitCode);
