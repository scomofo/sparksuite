var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.S = {
    performEditorChart: { id: "chart_1", title: "Demo Chart" },
    releaseInfo: { appId: "sparksuite", version: "1.0.0" },
    desktopInfo: {},
    editorObject: {
      id: "obj_1",
      title: "Editor Demo",
      events: [{ id: "evt_1", type: "note", t: 1 }],
      phrases: [{ id: "phrase_1", name: "Verse", startSec: 0, endSec: 4 }],
      steps: [{ id: "step_1", chord: "C" }]
    },
    editorLibrary: [],
    editorPlayheadSec: 8,
    editorSelectedId: "evt_1",
    editorClipboard: null
  };
  global.__sparkState = null;
  global.SparkState = undefined;
  global.saveState = function() {};
  global.exportEditorObject = function() { return "browser-export"; };
  global.document = {
    body: {
      appendChild: function() {},
      removeChild: function() {}
    },
    createElement: function() {
      return {
        click: function() {},
        href: "",
        download: ""
      };
    }
  };
  global.URL = {
    createObjectURL: function() { return "blob:test"; },
    revokeObjectURL: function() {}
  };
  global.Blob = function(parts, opts) {
    this.parts = parts;
    this.opts = opts;
  };
  global.markEditorCheckpoint = function() {};
  global.snapTimeSec = function(value) { return value; };
  global.addedItems = [];
  global.selectedItems = [];
  global.getSelectedEditorItem = function() { return S.editorObject.events[0]; };
  global.getSelectedEditorItemKind = function() { return "event"; };
  global.getSelectedEditorItems = function() { return S.editorObject.events.slice(); };
  global.addEditorItem = function(kind, item) {
    addedItems.push({ kind: kind, item: item });
  };
  global.clearEditorSelection = function() {
    selectedItems = [];
  };
  global.addEditorSelection = function(id) {
    selectedItems.push(id);
  };
}

async function test(name, fn) {
  try {
    resetState();
    await fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

console.log("\n--- Desktop And Editor State Fallbacks ---");

async function run() {
  await test("desktop bridge can build backups from plain global S", async function() {
    eval(loadJS("js/desktop/bridge.js"));

    var backup = buildFullLocalBackup();
    var exported = await exportEditorObjectDesktopAware();
    var backupExported = await exportFullBackupDesktopAware();

    assert.strictEqual(backup.app, "sparksuite");
    assert.strictEqual(backup.version, "1.0.0");
    assert.strictEqual(backup.state, S);
    assert.strictEqual(exported, "browser-export");
    assert.strictEqual(backupExported, true);
    assert.ok(S.desktopInfo.lastBackupAt);
  });

  await test("desktop bridge backup prefers active instrument app ids when release info is missing", async function() {
    S.releaseInfo = {};
    S.activeInstrument = "pianospark";
    eval(loadJS("js/desktop/bridge.js"));

    var backup = buildFullLocalBackup();

    assert.strictEqual(backup.app, "pianospark");
    assert.strictEqual(backup.version, "dev");
  });

  await test("editor io can save, load, export, and import through plain global S", function() {
    eval(loadJS("js/editor/io.js"));

    assert.strictEqual(saveEditorObjectToLibrary(), true);
    assert.strictEqual(S.editorDirty, false);
    assert.strictEqual(loadEditorObjectFromLibrary("obj_1").title, "Editor Demo");
    assert.strictEqual(exportEditorObject(), true);
    assert.strictEqual(importEditorObjectFromJson('{"id":"imported","title":"Imported"}'), true);
    assert.strictEqual(S.editorObject.id, "imported");
  });

  await test("editor clipboard helpers can copy and paste through plain global S", function() {
    eval(loadJS("js/editor/clipboard.js"));

    assert.strictEqual(copySelectedEditorItem(), true);
    assert.strictEqual(S.editorClipboard.kind, "event");
    assert.strictEqual(pasteEditorClipboardAtPlayhead(), true);
    assert.strictEqual(addedItems[0].kind, "event");
    assert.strictEqual(addedItems[0].item.t, 8);
  });

  await test("desktop and editor helpers fall back to global S when SparkState.getRoot returns null", async function() {
    global.SparkState = { getRoot: function() { return null; } };
    eval(loadJS("js/desktop/bridge.js"));
    eval(loadJS("js/editor/io.js"));
    eval(loadJS("js/editor/clipboard.js"));

    assert.strictEqual(buildFullLocalBackup().state, S);
    assert.strictEqual(saveEditorObjectToLibrary(), true);
    assert.strictEqual(copySelectedEditorItem(), true);
    assert.strictEqual(S.editorClipboard.kind, "event");
  });

  if (failed) {
    process.exitCode = 1;
  } else {
    console.log("\n" + passed + " passed, 0 failed");
  }
}

run().catch(function(err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
