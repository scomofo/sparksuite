var assert = require('assert');
var fs = require('fs');
var path = require('path');

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
}

global.window = global;
global.SparkSessionSegmentTypes = { RHYTHM_HIGHWAY: 'rhythm_highway', CHALLENGE: 'challenge', TRANSITION: 'transition' };
global.SparkUkuleleMiniSessions = null;
global.SparkPracticeTemplates = null;
global.SparkSessionSegment = null;

eval(loadJS('js/sparksuite/core/practice_engine.js'));

function test(name, fn) {
  try {
    fn();
    console.log('PASS:', name);
  } catch (err) {
    console.error('FAIL:', name);
    console.error(err.message);
    process.exitCode = 1;
  }
}

// --- processDrillSwitch ---

test('processDrillSwitch: normal pace resets consecutive counters', function() {
  var pe = new SparkSuitePracticeEngine();
  var bpm = 60; // targetSecs = 1.0; elapsed 0.9 is between 0.8 and 1.5 → neither fast nor slow
  var result = pe.processDrillSwitch(
    { drillAdaptiveBpm: bpm, drillConsecutiveFast: 2, drillConsecutiveSlow: 1, drillSwitches: 0, drillIdx: 0 },
    { elapsed: 0.9, fromChord: 'Am', toChord: 'G' }
  );
  assert.strictEqual(result.drillConsecutiveFast, 0);
  assert.strictEqual(result.drillConsecutiveSlow, 0);
  assert.strictEqual(result.drillAdaptiveBpm, bpm); // no change
  assert.strictEqual(result.drillIdx, 1);
  assert.strictEqual(result.drillSwitches, 1);
});

test('processDrillSwitch: three consecutive fast switches trigger speed_up and raise BPM', function() {
  var pe = new SparkSuitePracticeEngine();
  // bpm=60, targetSecs=1.0, fast threshold = 0.8s; elapsed=0.5 is fast
  var state = { drillAdaptiveBpm: 60, drillConsecutiveFast: 2, drillConsecutiveSlow: 0, drillSwitches: 5, drillIdx: 0 };
  var result = pe.processDrillSwitch(state, { elapsed: 0.5, fromChord: 'Am', toChord: 'G' });
  assert.strictEqual(result.drillAdaptiveBpm, 63);
  assert.strictEqual(result.drillConsecutiveFast, 0); // reset after trigger
  var ids = result.microRewards.map(function(r) { return r.id; });
  assert.ok(ids.indexOf('speed_up') >= 0);
});

test('processDrillSwitch: two consecutive slow switches reduce BPM', function() {
  var pe = new SparkSuitePracticeEngine();
  // bpm=60, targetSecs=1.0, slow threshold = 1.5s; elapsed=2.0 is slow
  var state = { drillAdaptiveBpm: 60, drillConsecutiveFast: 0, drillConsecutiveSlow: 1, drillSwitches: 5, drillIdx: 0 };
  var result = pe.processDrillSwitch(state, { elapsed: 2.0, fromChord: 'Am', toChord: 'G' });
  assert.strictEqual(result.drillAdaptiveBpm, 55); // 60 - 5
  assert.strictEqual(result.drillConsecutiveSlow, 0);
});

test('processDrillSwitch: BPM is clamped at 160 max and 40 min', function() {
  var pe = new SparkSuitePracticeEngine();
  // BPM already at cap, trigger speed_up
  var stateHigh = { drillAdaptiveBpm: 159, drillConsecutiveFast: 2, drillConsecutiveSlow: 0, drillSwitches: 0, drillIdx: 0 };
  var resHigh = pe.processDrillSwitch(stateHigh, { elapsed: 0.1, fromChord: 'A', toChord: 'B' });
  assert.strictEqual(resHigh.drillAdaptiveBpm, 160);

  // BPM already near floor, trigger slow down (elapsed=5 > targetSecs*1.5 for bpm=42: 60/42*1.5≈2.14s)
  var stateLow = { drillAdaptiveBpm: 42, drillConsecutiveFast: 0, drillConsecutiveSlow: 1, drillSwitches: 0, drillIdx: 0 };
  var resLow = pe.processDrillSwitch(stateLow, { elapsed: 5, fromChord: 'A', toChord: 'B' });
  assert.strictEqual(resLow.drillAdaptiveBpm, 40);
});

test('processDrillSwitch: elapsed >= 15 skips stats and BPM logic', function() {
  var pe = new SparkSuitePracticeEngine();
  var state = { drillAdaptiveBpm: 60, drillConsecutiveFast: 0, drillConsecutiveSlow: 0, drillSwitches: 0, drillIdx: 0 };
  var result = pe.processDrillSwitch(state, { elapsed: 20, fromChord: 'Am', toChord: 'G' });
  assert.strictEqual(result.transitionStats, null);
  assert.strictEqual(result.drillAdaptiveBpm, 60); // unchanged
});

test('processDrillSwitch: clean_switch microReward on first switch', function() {
  var pe = new SparkSuitePracticeEngine();
  var state = { drillAdaptiveBpm: 60, drillConsecutiveFast: 0, drillConsecutiveSlow: 0, drillSwitches: 0, drillIdx: 0 };
  var result = pe.processDrillSwitch(state, { elapsed: 1.0, fromChord: 'Am', toChord: 'G' });
  var ids = result.microRewards.map(function(r) { return r.id; });
  assert.ok(ids.indexOf('clean_switch') >= 0);
});

test('processDrillSwitch: three_switches microReward on third switch', function() {
  var pe = new SparkSuitePracticeEngine();
  var state = { drillAdaptiveBpm: 60, drillConsecutiveFast: 0, drillConsecutiveSlow: 0, drillSwitches: 2, drillIdx: 0 };
  var result = pe.processDrillSwitch(state, { elapsed: 1.0, fromChord: 'Am', toChord: 'G' });
  var ids = result.microRewards.map(function(r) { return r.id; });
  assert.ok(ids.indexOf('three_switches') >= 0);
});

test('processDrillSwitch: includes transitionStats key for valid elapsed', function() {
  var pe = new SparkSuitePracticeEngine();
  var result = pe.processDrillSwitch(
    { drillAdaptiveBpm: 60, drillConsecutiveFast: 0, drillConsecutiveSlow: 0, drillSwitches: 0, drillIdx: 0 },
    { elapsed: 1.2, fromChord: 'Am', toChord: 'G' }
  );
  assert.ok(result.transitionStats);
  assert.strictEqual(result.transitionStats.key, 'Am->G');
  assert.strictEqual(result.transitionStats.elapsed, 1.2);
});

// --- processQuizAnswer ---

test('processQuizAnswer: correct answer increments score, streak, correct, xpDelta=10', function() {
  var pe = new SparkSuitePracticeEngine();
  var result = pe.processQuizAnswer(
    { quizScore: 3, quizTotal: 5, quizStreak: 1, quizCorrect: 3 },
    { correct: true }
  );
  assert.strictEqual(result.quizScore, 4);
  assert.strictEqual(result.quizTotal, 6);
  assert.strictEqual(result.quizStreak, 2);
  assert.strictEqual(result.quizCorrect, 4);
  assert.strictEqual(result.xpDelta, 10);
  assert.strictEqual(result.correct, true);
});

test('processQuizAnswer: wrong answer resets streak, no XP', function() {
  var pe = new SparkSuitePracticeEngine();
  var result = pe.processQuizAnswer(
    { quizScore: 2, quizTotal: 3, quizStreak: 2, quizCorrect: 2 },
    { correct: false }
  );
  assert.strictEqual(result.quizScore, 2); // unchanged
  assert.strictEqual(result.quizTotal, 4);
  assert.strictEqual(result.quizStreak, 0);
  assert.strictEqual(result.xpDelta, 0);
  assert.strictEqual(result.correct, false);
});

test('processQuizAnswer: quiz_streak microReward fires at streak 3', function() {
  var pe = new SparkSuitePracticeEngine();
  var result = pe.processQuizAnswer(
    { quizScore: 2, quizTotal: 2, quizStreak: 2, quizCorrect: 2 },
    { correct: true }
  );
  var ids = result.microRewards.map(function(r) { return r.id; });
  assert.ok(ids.indexOf('quiz_streak') >= 0);
});

test('processQuizAnswer: quiz_streak not fired unless streak hits exactly 3', function() {
  var pe = new SparkSuitePracticeEngine();
  // streak going from 3 to 4 should NOT fire it again
  var result = pe.processQuizAnswer(
    { quizScore: 3, quizTotal: 3, quizStreak: 3, quizCorrect: 3 },
    { correct: true }
  );
  var ids = result.microRewards.map(function(r) { return r.id; });
  assert.ok(ids.indexOf('quiz_streak') < 0);
});

// --- processFingerExerciseCompletion ---

test('processFingerExerciseCompletion: increments count and returns xpDelta=10', function() {
  var pe = new SparkSuitePracticeEngine();
  var result = pe.processFingerExerciseCompletion(
    { fingerExCount: 2 },
    { exerciseId: 'ex_spider' }
  );
  assert.strictEqual(result.fingerExCount, 3);
  assert.strictEqual(result.xpDelta, 10);
  assert.ok(result.fingerStatsDelta);
  assert.strictEqual(result.fingerStatsDelta.exerciseId, 'ex_spider');
  assert.strictEqual(result.fingerStatsDelta.increment, 1);
});

test('processFingerExerciseCompletion: handles zero count state', function() {
  var pe = new SparkSuitePracticeEngine();
  var result = pe.processFingerExerciseCompletion({}, { exerciseId: 'ex_warmup' });
  assert.strictEqual(result.fingerExCount, 1);
  assert.strictEqual(result.fingerStatsDelta.exerciseId, 'ex_warmup');
});
