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

function test(name, fn) {
  try {
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Cloud UI Resolution ---");

test("cloud conflict controls route through app actions", function() {
  var source = loadJS("js/cloud/ui.js");
  assert.ok(source.indexOf("act('cloudResolveConflict','local')") >= 0);
  assert.ok(source.indexOf("act('cloudResolveConflict','cloud')") >= 0);
  assert.ok(source.indexOf("act('cloudResolveConflict','newest')") >= 0);
});

test("utility family handles cloud conflict resolution", function() {
  var source = loadJS("js/actions/utility_family.js");
  assert.ok(source.indexOf('if (a === "cloudResolveConflict") {') >= 0);
  assert.ok(source.indexOf('if (typeof resolveCloudConflict === "function") resolveCloudConflict(v);') >= 0);
});

if (process.exitCode) process.exit(process.exitCode);
