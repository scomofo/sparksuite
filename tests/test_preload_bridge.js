var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

var exposures = {};
var invocations = [];
var sends = [];
var listeners = {};

var fakeElectron = {
  contextBridge: {
    exposeInMainWorld: function(name, value) {
      exposures[name] = value;
    }
  },
  ipcRenderer: {
    invoke: function() {
      invocations.push(Array.prototype.slice.call(arguments));
      return Promise.resolve({ ok: true });
    },
    send: function() {
      sends.push(Array.prototype.slice.call(arguments));
    },
    on: function(channel, handler) {
      listeners[channel] = handler;
    },
    removeListener: function(channel, handler) {
      if (listeners[channel] === handler) delete listeners[channel];
    }
  }
};

var sandbox = {
  require: function(name) {
    if (name === "electron") return fakeElectron;
    return require(name);
  },
  console: console,
  Promise: Promise,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
};

vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, "..", "preload.js"), "utf8"),
  sandbox,
  { filename: "preload.js" }
);

console.log("=== Preload Bridge Tests ===");

test("preload exposes electron bridge", function() {
  assert.ok(exposures.electron);
  assert.ok(exposures.electron.stems);
  assert.ok(exposures.electron.sparkgame);
});

test("preload exposes sparkDesktop bridge", function() {
  assert.ok(exposures.sparkDesktop);
  assert.strictEqual(typeof exposures.sparkDesktop.saveJson, "function");
  assert.strictEqual(typeof exposures.sparkDesktop.openJson, "function");
  assert.strictEqual(typeof exposures.sparkDesktop.getAppInfo, "function");
  assert.strictEqual(typeof exposures.sparkDesktop.checkForUpdates, "function");
});

test("sparkDesktop methods invoke expected IPC channels", function() {
  invocations.length = 0;
  exposures.sparkDesktop.saveJson({ hello: "world" });
  exposures.sparkDesktop.openJson();
  exposures.sparkDesktop.getAppInfo();
  exposures.sparkDesktop.checkForUpdates();
  assert.deepStrictEqual(invocations, [
    ["save-json", { hello: "world" }],
    ["open-json"],
    ["get-app-info"],
    ["check-for-updates"]
  ]);
});

test("existing electron bridges still invoke expected IPC channels", function() {
  invocations.length = 0;
  sends.length = 0;
  exposures.electron.stems.openFile();
  exposures.electron.stems.separate("song.wav");
  exposures.electron.stems.checkCache("song.wav");
  exposures.electron.stems.getFileUrl("stem.wav");
  exposures.electron.stems.cancel();
  exposures.electron.sparkgame.launch({ id: "chart" });
  exposures.electron.sparkgame.charter("song.mp3", "guitar", "hard");
  assert.deepStrictEqual(invocations, [
    ["stems:openFile"],
    ["stems:separate", "song.wav"],
    ["stems:checkCache", "song.wav"],
    ["stems:getFileUrl", "stem.wav"],
    ["sparkgame:launch", { id: "chart" }],
    ["sparkgame:charter", "song.mp3", "guitar", "hard"]
  ]);
  assert.deepStrictEqual(sends, [
    ["stems:cancel"]
  ]);
});

test("stems progress subscription registers and unregisters listeners", function() {
  var seen = [];
  var unsubscribe = exposures.electron.stems.onProgress(function(data) {
    seen.push(data);
  });
  assert.strictEqual(typeof listeners["stems:progress"], "function");
  listeners["stems:progress"](null, { percent: 50 });
  unsubscribe();
  assert.deepStrictEqual(seen, [{ percent: 50 }]);
  assert.ok(!listeners["stems:progress"]);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
