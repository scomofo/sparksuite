var assert = require("assert");

global.window = {};
global.performance = {
  _value: 0,
  now: function() {
    return this._value;
  }
};

require("../js/sparksuite/runtime/gameplay_timing_config.js");
require("../js/sparksuite/runtime/input_calibration.js");
require("../js/sparksuite/runtime/practice_assist_config.js");
require("../js/sparksuite/gameplay/gameplay_timing.js");
require("../js/sparksuite/gameplay/scoring_engine.js");
var debugStateModule = require("../js/sparksuite/debug/spark_debug_state.js");

var DefaultGameplayTiming = window.SparkDefaultGameplayTiming;
var normalizeTimingConfig = window.SparkNormalizeTimingConfig;
var scoreTimingDelta = window.SparkScoreTimingDelta;
var InputCalibrationSession = window.SparkInputCalibrationSession;
var DefaultPracticeAssist = window.SparkDefaultPracticeAssist;
var normalizePracticeAssist = window.SparkNormalizePracticeAssist;
var getEffectiveTravelTimeMs = window.SparkGetEffectiveTravelTimeMs;
var resolveLoopedPositionMs = window.SparkResolveLoopedPositionMs;
var shouldAllowFailure = window.SparkShouldAllowFailure;
var GameplayTiming = window.SparkGameplayTiming;
var GameplayScoringEngine = window.SparkGameplayScoringEngine;

assert.strictEqual(DefaultGameplayTiming.hitWindowMs, 140);
assert.strictEqual(DefaultGameplayTiming.noteSpeed, 0.32);
assert.deepStrictEqual(normalizeTimingConfig({ noteSpeed: 0.9 }), {
  hitWindowMs: 140,
  perfectWindowMs: 50,
  goodWindowMs: 90,
  noteSpeed: 0.9,
  inputLatencyOffsetMs: 0
});
assert.strictEqual(scoreTimingDelta(45, DefaultGameplayTiming), "perfect");
assert.strictEqual(scoreTimingDelta(110, DefaultGameplayTiming), "hit");
assert.strictEqual(scoreTimingDelta(130, { inputLatencyOffsetMs: 40 }), "good");

var scorer = new GameplayScoringEngine({ inputLatencyOffsetMs: 20 });
assert.strictEqual(scorer.config.hitWindowMs, 140);
assert.strictEqual(scorer.judge({ inputTimeMs: 160, expectedTimeMs: 100 }).result, "perfect");

var calibration = new InputCalibrationSession({ beatsRequired: 4 });
calibration.recordTap({ expectedTimeMs: 100, actualTimeMs: 120 });
calibration.recordTap({ expectedTimeMs: 200, actualTimeMs: 222 });
calibration.recordTap({ expectedTimeMs: 300, actualTimeMs: 323 });
assert.strictEqual(calibration.isComplete(), false);
calibration.recordTap({ expectedTimeMs: 400, actualTimeMs: 480 });
assert.strictEqual(calibration.isComplete(), true);
assert.strictEqual(calibration.getOffsetMs(), 23);

assert.strictEqual(DefaultPracticeAssist.noFailMode, true);
assert.deepStrictEqual(normalizePracticeAssist({ speedMultiplier: 0.7, metronome: true }), {
  speedMultiplier: 0.75,
  loopRange: null,
  showGhostNotes: false,
  metronome: true,
  noFailMode: true,
  leftHanded: false,
  noStrumMode: false
});
assert.strictEqual(getEffectiveTravelTimeMs(1000, { speedMultiplier: 0.6 }), 1667);
assert.strictEqual(resolveLoopedPositionMs(5100, { loopRange: { startMs: 1000, endMs: 3000 } }), 1100);
assert.strictEqual(shouldAllowFailure({ noFailMode: true }), false);
assert.strictEqual(shouldAllowFailure({ noFailMode: false }), true);

assert.strictEqual(GameplayTiming.hitWindowMs, 140);
assert.strictEqual(GameplayTiming.noteSpeed, 0.32);

var state = debugStateModule.createSparkDebugState({
  sparkCore: {
    getActiveSessionView: function() {
      return {
        runtimeState: {
          gameplayTimingConfig: { hitWindowMs: 142, noteSpeed: 0.4 },
          practiceAssistConfig: { speedMultiplier: 0.75, noFailMode: true }
        }
      };
    }
  }
});
assert.deepStrictEqual(state.getTimingConfig(), { hitWindowMs: 142, noteSpeed: 0.4 });
assert.deepStrictEqual(state.getAssistConfig(), { speedMultiplier: 0.75, noFailMode: true });

console.log("PASS: runtime calibration and assist configs are normalized, scored, and inspectable");
