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

test("resolveTauriBundleArtifact finds the built tauri executable", function() {
  var root = fs.mkdtempSync(path.join(os.tmpdir(), "spark-tauri-"));
  var artifactPath = path.join(root, "src-tauri", "target", "release", "SparkSuite.exe");

  fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
  fs.writeFileSync(artifactPath, "tauri");

  assert.strictEqual(
    runner.resolveTauriBundleArtifact(root),
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

test("buildSmokePlan can build tauri smoke artifacts", function() {
  var plan = runner.buildSmokePlan({
    rootDir: "C:\\repo",
    runtime: "tauri",
    skipVerify: true,
    skipBuild: false
  });

  assert.deepStrictEqual(plan.commands, [
    "npm run tauri:build"
  ]);
  assert.strictEqual(plan.runtime, "tauri");
});

process.on("beforeExit", function() {
  console.log("\n" + passed + " passed, " + failed + " failed");
  if (failed > 0) process.exit(1);
});
