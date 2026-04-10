var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  PASS: " + name); }
  catch (e) { failed++; console.error("  FAIL: " + name + " -- " + e.message); }
}

function read(relPath) {
  return fs.readFileSync(path.join(__dirname, "..", relPath), "utf8");
}

function walkJsFiles(rootDir) {
  var results = [];
  fs.readdirSync(rootDir).forEach(function(entry) {
    var fullPath = path.join(rootDir, entry);
    var stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(walkJsFiles(fullPath));
    } else if (/\.js$/i.test(entry)) {
      results.push(fullPath);
    }
  });
  return results;
}

console.log("=== Execution Policy Tests ===");

function assertNoToken(files, token) {
  files.forEach(function(file) {
    var text = read(file);
    assert.strictEqual(
      text.indexOf(token),
      -1,
      file + " contains forbidden token " + token
    );
  });
}

test("normalized core entrypoints do not call direct launchers", function() {
  var files = [
    "js/editor/preview.js",
    "js/sparksuite/core/spark_core.js",
    "js/sparksuite/core/session_runtime.js"
  ];

  assertNoToken(files, "startPerformance(");
  assertNoToken(files, "startRhythmHighwaySegment(");
  assertNoToken(files, "startPlayableRhythmHighwayPayload(");
});

test("normalized entrypoints do not access legacy gameplay payloads directly", function() {
  var files = [
    "js/app.js",
    "js/editor/preview.js",
    "js/instruments/piano/app.js",
    "js/sparksuite/core/execution_gateway.js",
    "js/pages/rhythm_highway.js"
  ];

  assertNoToken(files, "segment.meta.gameplayPayload");
});

test("repo-wide launcher calls only exist in approved launcher and shell files", function() {
  var repoRoot = path.join(__dirname, "..");
  var approved = {
    "js/app.js": true,
    "js/instruments/piano/app.js": true,
    "js/performance/session.js": true,
    "js/pages/rhythm_highway.js": true,
    "js/sparksuite/core/execution_gateway.js": true
  };
  var tokens = [
    "startPerformance(",
    "startRhythmHighwaySegment(",
    "startPlayableRhythmHighwayPayload("
  ];

  walkJsFiles(path.join(repoRoot, "js")).forEach(function(fullPath) {
    var relPath = path.relative(repoRoot, fullPath).replace(/\\/g, "/");
    if (approved[relPath]) return;
    var text = fs.readFileSync(fullPath, "utf8");
    tokens.forEach(function(token) {
      assert.strictEqual(
        text.indexOf(token),
        -1,
        relPath + " contains forbidden launcher token " + token
      );
    });
  });
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
