var assert = require("assert");
var fs = require("fs");
var os = require("os");
var path = require("path");

var runner = require("../scripts/desktop_packaged_smoke.js");

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

console.log("=== Packaged Smoke Runner Tests ===");

test("resolveElectronPortableArtifact finds the packaged portable executable", function() {
  var root = fs.mkdtempSync(path.join(os.tmpdir(), "spark-portable-"));
  var artifactPath = path.join(root, "dist", "SparkSuite Portable.exe");

  fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
  fs.writeFileSync(artifactPath, "portable");

  assert.strictEqual(
    runner.resolveElectronPortableArtifact(root),
    artifactPath
  );
});

test("buildSmokePlan uses verify, portable build, and electron smoke by default", function() {
  var plan = runner.buildSmokePlan({
    rootDir: "C:\\repo",
    runtime: "electron",
    skipVerify: false,
    skipBuild: false
  });

  assert.deepStrictEqual(plan.commands, [
    "npm run verify",
    "npm run build:portable"
  ]);
  assert.strictEqual(plan.runtime, "electron");
});

test("buildSmokePlan is electron-only — no alternate runtimes", function() {
  var plan = runner.buildSmokePlan({
    rootDir: "C:\\repo",
    runtime: "tauri",
    skipVerify: true,
    skipBuild: false
  });

  // Tauri and Capacitor were removed when the project committed to a single
  // Windows Electron target; a stale runtime option must not change the plan.
  assert.deepStrictEqual(plan.commands, [
    "npm run build:portable"
  ]);
  assert.strictEqual(plan.runtime, "electron");
});

test("validatePackagedSmokePayload requires canonical full backup coverage", function() {
  assert.strictEqual(runner.validatePackagedSmokePayload({
    ok: true,
    completed: true,
    importedUserId: "smoke_user",
    exportedUserId: "smoke_user",
    debugBundleSessionId: "plan_1",
    backupIntegrity: {
      hasCanonicalUserData: true,
      hasDebugBundle: true,
      profileUserId: "smoke_user"
    }
  }), true);

  assert.throws(function() {
    runner.validatePackagedSmokePayload({
      ok: true,
      completed: true,
      importedUserId: "smoke_user",
      exportedUserId: "smoke_user",
      debugBundleSessionId: "plan_1",
      backupIntegrity: {
        hasCanonicalUserData: true,
        hasDebugBundle: false,
        profileUserId: "smoke_user"
      }
    });
  }, /complete full local backup/);
});

process.on("beforeExit", function() {
  console.log("\n" + passed + " passed, " + failed + " failed");
  if (failed > 0) process.exit(1);
});
