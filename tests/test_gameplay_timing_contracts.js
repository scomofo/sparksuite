var assert = require("assert");

global.window = {};
global.performance = {
  _value: 0,
  now: function() {
    return this._value;
  }
};

require("../js/sparksuite/runtime/gameplay_timing_config.js");
require("../js/sparksuite/gameplay/gameplay_timing.js");
require("../js/sparksuite/gameplay/input_mapper.js");
require("../js/sparksuite/gameplay/scoring_engine.js");
require("../js/sparksuite/core/timing_engine.js");

var GameplayTiming = window.SparkGameplayTiming;
var ExerciseClock = window.SparkExerciseClock;
var InputMapper = window.SparkInputMapper;
var DefaultKeyToLane = window.SparkDefaultKeyToLane;
var GameplayScoringEngine = window.SparkGameplayScoringEngine;
var TimingEngine = window.SparkTimingEngine;

assert.strictEqual(GameplayTiming.hitWindowMs, 140);
assert.strictEqual(GameplayTiming.perfectWindowMs, 50);
assert.strictEqual(GameplayTiming.goodWindowMs, 90);
assert.strictEqual(GameplayTiming.noteSpeed, 0.32);
assert.strictEqual(GameplayTiming.inputLatencyOffsetMs, 0);

var clock = new ExerciseClock(function() { return performance.now(); });
assert.throws(function() {
  clock.elapsedMs();
}, /has not started/);
performance._value = 100;
clock.start();
performance._value = 265;
assert.strictEqual(clock.elapsedMs(), 165);

var mapper = new InputMapper(DefaultKeyToLane);
assert.strictEqual(mapper.mapKey("a"), 0);
assert.strictEqual(mapper.mapKey("f"), 3);
assert.strictEqual(mapper.mapKey("z"), null);

var scorer = new GameplayScoringEngine({
  hitWindowMs: 150,
  perfectWindowMs: 50,
  goodWindowMs: 90,
  inputLatencyOffsetMs: 10
});
assert.strictEqual(scorer.judge({ inputTimeMs: 60, expectedTimeMs: 60 }).result, "perfect");
assert.strictEqual(scorer.judge({ inputTimeMs: 130, expectedTimeMs: 60 }).result, "good");
assert.strictEqual(scorer.judge({ inputTimeMs: 190, expectedTimeMs: 60 }).result, "hit");
assert.strictEqual(scorer.judge({ inputTimeMs: 260, expectedTimeMs: 60 }).result, "miss");

var timingEngine = new TimingEngine({ applyOffsetSec: function(sec) { return sec; } });
var engineClock = timingEngine.createExerciseClock(function() { return performance.now(); });
performance._value = 500;
engineClock.start();
performance._value = 725;
assert.strictEqual(engineClock.elapsedMs(), 225);

console.log("PASS: gameplay timing contracts expose config, relative clocks, mapping, and judgment");
