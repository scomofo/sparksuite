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

console.log("\n--- Audio Calibration Resolution ---");

test("legacy calibration page routes controls through performance actions", function() {
  var source = loadJS("js/audio/calibration.js");
  assert.ok(source.indexOf('onclick="act(\\\'performCalibrate\\\')"') >= 0);
  assert.ok(source.indexOf('onclick="act(\\\'performCalibrateStop\\\')"') >= 0);
});

if (process.exitCode) process.exit(process.exitCode);
