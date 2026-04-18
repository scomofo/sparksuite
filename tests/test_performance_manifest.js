var assert = require("assert");
var fs = require("fs");
var path = require("path");

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

global.window = global;

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

eval(loadJS("js/performance/chart_manifest.js"));

var manifest = window.PERFORMANCE_CHART_MANIFEST;
var chartDir = path.join(__dirname, "..", "data", "performance_charts");

console.log("=== Performance Manifest Tests ===");

test("manifest exposes a charts array", function() {
  assert.ok(manifest);
  assert.ok(Array.isArray(manifest.charts));
  assert.ok(manifest.charts.length > 0);
});

test("manifest chart ids are unique", function() {
  var seen = {};
  manifest.charts.forEach(function(chart) {
    assert.ok(!seen[chart.id], "duplicate chart id: " + chart.id);
    seen[chart.id] = true;
  });
});

test("every manifest chart has a backing performance chart file", function() {
  manifest.charts.forEach(function(chart) {
    var chartPath = path.join(chartDir, chart.id + ".json");
    assert.ok(fs.existsSync(chartPath), "missing chart file for manifest id: " + chart.id);
  });
});

test("imported package manifest entries point at package-backed chart files", function() {
  manifest.charts.forEach(function(chart) {
    if (chart.sourceType !== "imported_package") return;
    var chartPath = path.join(chartDir, chart.id + ".json");
    var json = JSON.parse(fs.readFileSync(chartPath, "utf8"));
    assert.strictEqual(json.packageFormat, "sparksuite_import_v1", chart.id + " should use sparksuite_import_v1");
  });
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
