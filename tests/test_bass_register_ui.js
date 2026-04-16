var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

global.window = global;
global.S = {};
global.__sparkState = global.S;
global.SparkHighway = { GUITAR_SKIN: "guitar_skin" };
global.SparkInstruments = {
  _active: null,
  register: function(module) {
    this._active = module;
  },
  getActive: function() {
    return this._active;
  }
};

eval(loadJS("js/instruments/bass/data.js"));
eval(loadJS("js/instruments/bass/ui.js"));
eval(loadJS("js/instruments/bass/register.js"));

var bass = SparkInstruments.getActive();

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

console.log("\n--- Bass Register UI ---");

test("bass chord renderer uses open-string markers for guided open-note shapes", function() {
  var svg = bass.ui.chord({ name: "E Open" }, 180);
  assert.ok(svg.indexOf("<svg") >= 0, "expected svg output");
  assert.ok(svg.indexOf('stroke="var(--accent)"') >= 0, "expected open-string marker");
});

test("bass chord renderer keeps finger markers for fretted pattern shapes", function() {
  var svg = bass.ui.chord({ name: "Root-Fifth E-B" }, 180);
  assert.ok(svg.indexOf("<svg") >= 0, "expected svg output");
  assert.ok(svg.indexOf('fill="#4ECDC4"') >= 0 || svg.indexOf('fill="#FF6B6B"') >= 0, "expected finger marker fill");
});

if (process.exitCode) process.exit(process.exitCode);
