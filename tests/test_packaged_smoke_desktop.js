var assert = require("assert");
var fs = require("fs");
var os = require("os");
var path = require("path");

var smokeModule = require("../desktop/packaged_smoke.js");

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

console.log("=== Packaged Smoke Desktop Tests ===");

test("buildRendererSmokeScript covers import, export, debug bundle, and session completion", function() {
  var source = smokeModule.buildRendererSmokeScript({
    userId: "smoke_user"
  });

  assert.ok(source.indexOf("importSparkUserData") >= 0, "should import migrated user data");
  assert.ok(source.indexOf("exportSparkUserData") >= 0, "should export canonical user data");
  assert.ok(source.indexOf("buildSparkDebugBundle") >= 0, "should export a debug bundle");
  assert.ok(source.indexOf("startSession") >= 0, "should start a real session");
  assert.ok(source.indexOf("completeSession") >= 0, "should complete the session");
});

test("runPackagedSmokeForWindow writes smoke results from the renderer", async function() {
  var outputPath = path.join(os.tmpdir(), "sparksuite_packaged_smoke_result.json");
  var executedScript = null;
  var listeners = {};
  var fakeWindow = {
    webContents: {
      on: function(eventName, handler) {
        listeners[eventName] = handler;
      },
      executeJavaScript: function(source) {
        executedScript = source;
        return Promise.resolve({
          ok: true,
          importedUserId: "smoke_user",
          exportedUserId: "smoke_user",
          sessionPlanId: "plan_1",
          completed: true,
          debugBundleSessionId: "plan_1",
          schemaVersion: 4
        });
      }
    }
  };

  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }

  await smokeModule.runPackagedSmokeForWindow(fakeWindow, {
    outputPath: outputPath,
    userId: "smoke_user"
  });

  await listeners["did-finish-load"]();

  assert.ok(executedScript, "should execute a renderer smoke script");
  assert.ok(fs.existsSync(outputPath), "should write smoke results to disk");

  var payload = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  assert.strictEqual(payload.ok, true);
  assert.strictEqual(payload.importedUserId, "smoke_user");
  assert.strictEqual(payload.completed, true);
});

test("runPackagedSmokeForWindow writes a structured failure payload when the renderer throws", async function() {
  var outputPath = path.join(os.tmpdir(), "sparksuite_packaged_smoke_error.json");
  var listeners = {};
  var fakeWindow = {
    webContents: {
      on: function(eventName, handler) {
        listeners[eventName] = handler;
      },
      executeJavaScript: function() {
        return Promise.reject(new Error("renderer smoke failed"));
      }
    }
  };

  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }

  await smokeModule.runPackagedSmokeForWindow(fakeWindow, {
    outputPath: outputPath,
    userId: "smoke_user"
  });

  await listeners["did-finish-load"]();

  var payload = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  assert.strictEqual(payload.ok, false);
  assert.ok(payload.error.indexOf("renderer smoke failed") >= 0);
});

process.on("beforeExit", function() {
  console.log("\n" + passed + " passed, " + failed + " failed");
  if (failed > 0) process.exit(1);
});
