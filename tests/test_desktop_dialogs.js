var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var passed = 0;
var failed = 0;
var tests = [];

function test(name, fn) {
  tests.push({ name: name, fn: fn });
}

var handlers = {};
var openDialogResult = { canceled: true, filePaths: [] };
var files = {};

var fakeElectron = {
  ipcMain: {
    handle: function(channel, handler) {
      handlers[channel] = handler;
    }
  },
  dialog: {
    showOpenDialog: function() {
      return Promise.resolve(openDialogResult);
    },
    showSaveDialog: function() {
      return Promise.resolve({ canceled: true });
    }
  }
};

var fakeFs = {
  readFileSync: function(filePath) {
    if (!Object.prototype.hasOwnProperty.call(files, filePath)) {
      throw new Error("Unexpected file read: " + filePath);
    }
    return files[filePath];
  },
  writeFileSync: function() {}
};

var sandbox = {
  module: { exports: {} },
  exports: {},
  require: function(name) {
    if (name === "electron") return fakeElectron;
    if (name === "fs") return fakeFs;
    if (name === "path") return path;
    return require(name);
  },
  __dirname: path.join(__dirname, "..", "desktop"),
  console: console,
  Buffer: Buffer
};

vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, "..", "desktop", "dialogs.js"), "utf8"),
  sandbox,
  { filename: "desktop/dialogs.js" }
);

var registerDialogs = sandbox.module.exports.registerDialogs;
registerDialogs();

console.log("=== Desktop Dialog Tests ===");

test("registerDialogs installs open-json handler", function() {
  assert.strictEqual(typeof handlers["open-json"], "function");
});

test("open-json returns text payload for json files", async function() {
  openDialogResult = {
    canceled: false,
    filePaths: ["C:\\temp\\chart.json"]
  };
  files["C:\\temp\\chart.json"] = Buffer.from('{"title":"Test Chart"}', "utf8");

  var result = await handlers["open-json"]();

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.extension, "json");
  assert.strictEqual(result.isBinary, false);
  assert.strictEqual(result.text, '{"title":"Test Chart"}');
  assert.strictEqual(result.base64, null);
});

test("open-json returns base64 payload for midi files", async function() {
  openDialogResult = {
    canceled: false,
    filePaths: ["C:\\temp\\song.mid"]
  };
  files["C:\\temp\\song.mid"] = Buffer.from([0x4d, 0x54, 0x68, 0x64, 0x00, 0x01, 0x02, 0x03]);

  var result = await handlers["open-json"]();

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.extension, "mid");
  assert.strictEqual(result.isBinary, true);
  assert.strictEqual(result.text, null);
  assert.strictEqual(result.base64, files["C:\\temp\\song.mid"].toString("base64"));
});

test("open-json returns not-ok when dialog is canceled", async function() {
  openDialogResult = {
    canceled: true,
    filePaths: []
  };

  var result = await handlers["open-json"]();

  assert.strictEqual(result.ok, false);
});

async function run() {
  for (var i = 0; i < tests.length; i++) {
    try {
      await tests[i].fn();
      passed++;
      console.log("  PASS: " + tests[i].name);
    } catch (err) {
      failed++;
      console.error("  FAIL: " + tests[i].name);
      console.error("    " + err.message);
    }
  }
  console.log("\n" + passed + " passed, " + failed + " failed");
  if (failed > 0) process.exit(1);
}

run();
