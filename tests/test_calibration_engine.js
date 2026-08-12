var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  require("vm").runInThisContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), { filename: path.join(__dirname, "..", file) });
}

global.window = global;
loadJS("js/sparksuite/core/practice_engine.js");
loadJS("js/audio/calibration.js");

var state = { calibrationOffsets: [12], calibrationRunning: false };
var renders = 0;
var engine = new SparkSuitePracticeEngine(null);

var start = engine.startCalibration(state, { bpm: 72 });
assert.strictEqual(start.calibrationRunning, true);
assert.deepStrictEqual(start.calibrationOffsets, []);
assert.strictEqual(start.calibrationBpm, 72);
assert.strictEqual(start.calibrationEffect, "startMetronome");
assert.strictEqual(state.calibrationRunning, false);

var stop = engine.stopCalibration(state);
assert.strictEqual(stop.calibrationRunning, false);
assert.strictEqual(state.calibrationRunning, false);
assert.strictEqual(stop.calibrationEffect, "stopMetronome");
assert.strictEqual(engine.getValidatedShellAction("sessionPauseBlock"), "sessionPauseBlock");
assert.strictEqual(engine.getValidatedShellAction("sessionPauseBlock');alert(1);//"), "openPracticePlan");

var uiStarts = [];
var uiStops = 0;
var uiEngine = new SparkSuitePracticeEngine(null);
global.S = { calibrationOffsets: [5], calibrationRunning: false };
global.sparkCore = { practiceEngine: uiEngine };
global.startCalibrationMetronome = function(bpm) { uiStarts.push(bpm); };
global.stopCalibrationMetronome = function() { uiStops++; };
global.render = function() { renders++; };
startCalibration();
assert.deepStrictEqual(S.calibrationOffsets, []);
assert.strictEqual(S.calibrationRunning, true);
assert.strictEqual(renders, 1);
assert.deepStrictEqual(uiStarts, [80]);
stopCalibration();
assert.strictEqual(S.calibrationRunning, false);
assert.strictEqual(renders, 2);
assert.strictEqual(uiStops, 1);

console.log("PASS: calibration start and stop are owned by the practice engine");
