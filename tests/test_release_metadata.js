var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;
var tests = [];

function test(name, fn) {
  tests.push({ name: name, fn: fn });
}

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

global.window = global;
global.S = {
  releaseInfo: null,
  releaseNotes: null,
  feedbackDraft: {}
};
global.isDesktopBuild = function() {
  return false;
};
global.sparkDesktop = undefined;
global.getReleaseChannel = function() {
  return "dev";
};

global.console = {
  warnCalls: [],
  log: console.log.bind(console),
  error: console.error.bind(console),
  warn: function() {
    this.warnCalls.push(Array.prototype.slice.call(arguments));
  }
};

var responses = {
  "release/manifest.json": {
    ok: true,
    data: {
      version: "1.2.3",
      contentVersion: "1.2.3"
    }
  },
  "release/changelog.json": {
    ok: true,
    data: [
      { version: "1.2.3", notes: ["Fixed drift"] }
    ]
  }
};

global.fetch = function(targetPath) {
  if (!Object.prototype.hasOwnProperty.call(responses, targetPath)) {
    return Promise.reject(new Error("Unexpected fetch path: " + targetPath));
  }
  var entry = responses[targetPath];
  return Promise.resolve({
    ok: entry.ok !== false,
    json: function() {
      return Promise.resolve(clone(entry.data));
    }
  });
};

eval(loadJS("js/release/info.js"));
eval(loadJS("js/desktop/feedback.js"));

console.log("=== Release Metadata Tests ===");

test("loadReleaseInfo stores manifest when fetch succeeds", async function() {
  S.releaseInfo = null;
  await loadReleaseInfo();
  assert.strictEqual(S.releaseInfo.version, "1.2.3");
  assert.strictEqual(getReleaseVersion(), "1.2.3");
});

test("loadReleaseInfo clears stale data when fetch response is not ok", async function() {
  S.releaseInfo = { version: "stale" };
  responses["release/manifest.json"] = {
    ok: false,
    data: { version: "bad-body" }
  };

  await loadReleaseInfo();

  assert.strictEqual(S.releaseInfo, null);
  assert.strictEqual(getReleaseVersion(), "dev");
  responses["release/manifest.json"] = {
    ok: true,
    data: {
      version: "1.2.3",
      contentVersion: "1.2.3"
    }
  };
});

test("loadReleaseNotes stores notes when fetch succeeds", async function() {
  S.releaseNotes = null;
  await loadReleaseNotes();
  assert.ok(Array.isArray(S.releaseNotes));
  assert.strictEqual(S.releaseNotes.length, 1);
});

test("loadReleaseNotes clears stale data when fetch response is not ok", async function() {
  S.releaseNotes = [{ version: "stale" }];
  responses["release/changelog.json"] = {
    ok: false,
    data: [{ version: "bad-body" }]
  };

  await loadReleaseNotes();

  assert.deepStrictEqual(S.releaseNotes, []);
  responses["release/changelog.json"] = {
    ok: true,
    data: [
      { version: "1.2.3", notes: ["Fixed drift"] }
    ]
  };
});

test("exportFeedbackDesktopAware returns false when desktop bridge is unavailable", async function() {
  global.isDesktopBuild = function() {
    return true;
  };
  global.sparkDesktop = undefined;

  var result = await exportFeedbackDesktopAware();

  assert.strictEqual(result, false);
  global.isDesktopBuild = function() {
    return false;
  };
});

test("exportFeedbackDesktopAware forwards payload to desktop bridge when available", async function() {
  global.isDesktopBuild = function() {
    return true;
  };
  S.feedbackDraft = { text: "Needs less drift" };
  global.sparkDesktop = {
    saveJsonCalls: [],
    saveJson: function(payload) {
      this.saveJsonCalls.push(payload);
      return Promise.resolve({ ok: true, path: "feedback.json" });
    }
  };

  var result = await exportFeedbackDesktopAware();

  assert.strictEqual(result.ok, true);
  assert.strictEqual(global.sparkDesktop.saveJsonCalls.length, 1);
  assert.strictEqual(global.sparkDesktop.saveJsonCalls[0].feedback.text, "Needs less drift");
  global.sparkDesktop = undefined;
  global.isDesktopBuild = function() {
    return false;
  };
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
