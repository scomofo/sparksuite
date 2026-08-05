// ===== Progress Orchestrator Drive Mode Tests =====
// Run: node tests/test_progress_orchestrator_drive.js
//
// Phase 7 retirement: applySessionOutcome(sessionResult, { drive: true }) is
// the single progression entry point for retired flows. The session
// progression sequence (streak, XP/jackpot, chord mastery, level-up, history,
// events, badges, evaluateAll cascade) is absorbed into
// SparkProgressOrchestrator.runSessionProgression; SparkSession.processResults
// is a thin delegate kept for legacy callers. Activity flows (drill, daily,
// rhythm, runner) run their own completion sequences. Without the drive flag,
// applySessionOutcome must stay a read-only observer.

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  PASS: ' + name);
  } catch (e) {
    failed++;
    console.error('  FAIL: ' + name);
    console.error('    ' + e.message);
  }
}

function loadInto(ctx, file) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), ctx);
}

function makeContext(opts) {
  opts = opts || {};
  var ctx = {
    console: { debug: function() {} },
    Date: Date,
    JSON: JSON,
    emits: [],
    historyCalls: []
  };
  // Deterministic jackpot control: the sequence rolls Math.random() < 1/15.
  ctx.Math = Object.create(Math);
  ctx.Math.random = function() { return opts.random != null ? opts.random : 0.9; };
  if (!opts.withoutState) {
    ctx.S = { xp: 40, level: 1, playerLevel: 1, sessions: 0, chordProgress: {} };
  }
  ctx._sparkEmit = function(type, payload) { ctx.emits.push({ type: type, payload: payload }); };
  ctx.logHistory = function(t, d, xp) { ctx.historyCalls.push([t, d, xp]); };
  ctx.saveState = function() {};
  ctx.window = ctx;
  vm.createContext(ctx);
  loadInto(ctx, 'js/spark-core/runtime/contracts.js');
  loadInto(ctx, 'js/spark-core/progress-orchestrator.js');
  return ctx;
}

console.log('=== Progress Orchestrator Drive Mode Tests ===');

test('session drive runs the absorbed progression sequence exactly once', function() {
  var ctx = makeContext();
  var result = ctx.SparkContracts.createSessionResult({
    mode: 'quickStart', chordName: 'Am', duration: 120, accuracy: 0.75, completed: true
  });
  var outcome = ctx.SparkProgressOrchestrator.applySessionOutcome(result, { drive: true });
  assert.strictEqual(ctx.S.sessions, 1, 'sequence must run exactly once');
  assert.strictEqual(ctx.S.xp, 50, 'starting 40 xp + 10 session award');
  assert.strictEqual(ctx.S.chordProgress['Am'], 34, 'chord mastery +34');
  assert.strictEqual(ctx.S.streak, 1, 'first session today updates the streak');
  assert.strictEqual(outcome.xpEarned, 10);
  assert.ok(outcome.streakChanges, 'streak change must be reported');
  assert.strictEqual(outcome.sessionEffects.jackpot, false);
});

test('quickStart and chord modes emit as legacy type "session"', function() {
  var ctx = makeContext();
  ctx.SparkProgressOrchestrator.applySessionOutcome({ mode: 'quickStart', chordName: 'Am' }, { drive: true });
  ctx.SparkProgressOrchestrator.applySessionOutcome({ mode: 'chord', chordName: 'Em' }, { drive: true });
  assert.strictEqual(ctx.emits[0].payload.type, 'session');
  assert.strictEqual(ctx.emits[0].payload.chord, 'Am');
  assert.strictEqual(ctx.emits[1].payload.type, 'session');
});

test('song mode is preserved through the session sequence', function() {
  var ctx = makeContext();
  ctx.SparkProgressOrchestrator.applySessionOutcome({ mode: 'song', songId: 'x' }, { drive: true });
  assert.strictEqual(ctx.emits[0].payload.type, 'song');
});

test('jackpot roll awards 50 XP and reports it on sessionEffects', function() {
  var ctx = makeContext({ random: 0 });
  var outcome = ctx.SparkProgressOrchestrator.applySessionOutcome({ mode: 'quickStart' }, { drive: true });
  assert.strictEqual(outcome.xpEarned, 50);
  assert.strictEqual(outcome.sessionEffects.jackpot, true);
});

test('mastering the last chord of the level maps into levelUps', function() {
  var ctx = makeContext();
  ctx.S.chordProgress = { Am: 66 };
  ctx.SparkInstrumentAdapter = {
    getCurriculum: function() { return { CHORDS: { 1: [{ name: 'Am' }] } }; }
  };
  var outcome = ctx.SparkProgressOrchestrator.applySessionOutcome({ mode: 'quickStart', chordName: 'Am' }, { drive: true });
  assert.strictEqual(ctx.S.chordProgress['Am'], 100, '66 + 34 caps at 100');
  assert.strictEqual(ctx.S.level, 2);
  assert.strictEqual(outcome.levelUps.length, 1);
  assert.strictEqual(outcome.levelUps[0], 2);
  assert.strictEqual(outcome.sessionEffects.leveledUp, true);
});

test('SparkSession.processResults delegates to the absorbed sequence', function() {
  var ctx = makeContext();
  loadInto(ctx, 'js/spark-core/session-engine.js');
  var outcome = ctx.SparkSession.processResults({ type: 'session', chordName: 'Am', duration: 120 });
  assert.strictEqual(ctx.S.sessions, 1);
  assert.strictEqual(outcome.xpEarned, 10);
  assert.strictEqual(ctx.S.chordProgress['Am'], 34);
});

test('drive without app state returns zeroed effects without throwing', function() {
  var ctx = makeContext({ withoutState: true });
  var outcome = ctx.SparkProgressOrchestrator.applySessionOutcome({ mode: 'quickStart' }, { drive: true });
  assert.strictEqual(outcome.xpEarned, 0);
  assert.strictEqual(outcome.sessionEffects.streakUpdated, false);
});

test('drive mode routes drill through the activity completion sequence, not the session sequence', function() {
  var ctx = makeContext();
  ctx.activityCompletions = [];
  ctx.SparkProgressBridge = {
    applyLegacyActivityCompletion: function(payload) { ctx.activityCompletions.push(payload); }
  };
  var outcome = ctx.SparkProgressOrchestrator.applySessionOutcome({
    mode: 'drill',
    instrumentId: 'chordspark',
    exerciseResults: ['Am', 'G']
  }, { drive: true });
  assert.strictEqual(ctx.S.sessions, 0, 'drill must not run the session sequence');
  assert.strictEqual(ctx.activityCompletions.length, 1, 'drill runs the activity completion exactly once');
  var payload = ctx.activityCompletions[0];
  assert.strictEqual(payload.xpDelta, 20);
  assert.strictEqual(payload.incrementFields.drillCount, 1);
  assert.strictEqual(payload.history.detail, 'Am / G');
  assert.strictEqual(payload.emit.payload.appId, 'chordspark');
  assert.strictEqual(payload.checkBadges, true);
  assert.strictEqual(outcome.xpEarned, 20);
  assert.strictEqual(outcome.sessionEffects.jackpot, false);
});

test('daily drive awards the challenge XP with flags, count, history, and badges', function() {
  var ctx = makeContext();
  ctx.activityCompletions = [];
  ctx.SparkProgressBridge = {
    applyLegacyActivityCompletion: function(payload) { ctx.activityCompletions.push(payload); }
  };
  var outcome = ctx.SparkProgressOrchestrator.applySessionOutcome({
    mode: 'daily',
    meta: { challenge: { id: 'hold', title: 'Hold It', xp: 55 } }
  }, { drive: true });
  var payload = ctx.activityCompletions[0];
  assert.strictEqual(payload.xpDelta, 55);
  assert.strictEqual(payload.setFlags.dailyComplete, true);
  assert.strictEqual(payload.incrementFields.dailyDone, 1);
  assert.strictEqual(payload.history.detail, 'Hold It');
  assert.strictEqual(payload.checkBadges, true);
  assert.strictEqual(outcome.xpEarned, 55);
  assert.strictEqual(ctx.S.sessions, 0);
});

test('daily drive defaults to 40 XP and "Challenge" when no challenge meta exists', function() {
  var ctx = makeContext();
  ctx.activityCompletions = [];
  ctx.SparkProgressBridge = {
    applyLegacyActivityCompletion: function(payload) { ctx.activityCompletions.push(payload); }
  };
  var outcome = ctx.SparkProgressOrchestrator.applySessionOutcome({ mode: 'daily' }, { drive: true });
  assert.strictEqual(ctx.activityCompletions[0].xpDelta, 40);
  assert.strictEqual(ctx.activityCompletions[0].history.detail, 'Challenge');
  assert.strictEqual(outcome.xpEarned, 40);
});

test('rhythm drive owns the score/10 XP policy and skips zero-score awards', function() {
  var ctx = makeContext();
  ctx.activityCompletions = [];
  ctx.SparkProgressBridge = {
    applyLegacyActivityCompletion: function(payload) { ctx.activityCompletions.push(payload); }
  };
  var outcome = ctx.SparkProgressOrchestrator.applySessionOutcome({
    mode: 'rhythm',
    meta: { score: 230 }
  }, { drive: true });
  assert.strictEqual(ctx.activityCompletions[0].xpDelta, 23);
  assert.strictEqual(ctx.activityCompletions[0].history.detail, 'Score: 230');
  assert.strictEqual(outcome.xpEarned, 23);

  var zero = ctx.SparkProgressOrchestrator.applySessionOutcome({
    mode: 'rhythm',
    meta: { score: 0 }
  }, { drive: true });
  assert.strictEqual(ctx.activityCompletions.length, 1, 'zero score must not run the completion sequence');
  assert.strictEqual(zero.xpEarned, 0);
});

test('runner drive persists high score and results even on a zero-XP run', function() {
  var ctx = makeContext();
  ctx.activityCompletions = [];
  ctx.SparkProgressBridge = {
    applyLegacyActivityCompletion: function(payload) { ctx.activityCompletions.push(payload); }
  };
  var results = { score: 5, maxCombo: 1, distance: 3 };
  var outcome = ctx.SparkProgressOrchestrator.applySessionOutcome({
    mode: 'runner',
    meta: { score: 5, results: results }
  }, { drive: true });
  var payload = ctx.activityCompletions[0];
  assert.strictEqual(payload.xpDelta, 0, 'score 5 rounds to 0 XP');
  assert.strictEqual(payload.maxFields.runnerHighScore, 5);
  assert.strictEqual(payload.resultFields.runnerResults.distance, 3);
  assert.strictEqual(payload.history, null);
  assert.strictEqual(outcome.xpEarned, 0);

  var scored = ctx.SparkProgressOrchestrator.applySessionOutcome({
    mode: 'runner',
    meta: { score: 100, results: results }
  }, { drive: true });
  assert.strictEqual(ctx.activityCompletions[1].xpDelta, 5);
  assert.strictEqual(ctx.activityCompletions[1].history.detail, 'Score: 100');
  assert.strictEqual(scored.xpEarned, 5);
});

test('drill drive falls back to direct state updates when the bridge is absent', function() {
  var ctx = makeContext();
  ctx.badgeChecks = 0;
  ctx.checkBadges = function() { ctx.badgeChecks++; };
  var outcome = ctx.SparkProgressOrchestrator.applySessionOutcome({
    mode: 'drill',
    exerciseResults: ['C']
  }, { drive: true });
  assert.strictEqual(ctx.S.drillCount, 1);
  assert.strictEqual(ctx.S.xp, 60, 'starting 40 xp + 20 drill award');
  assert.strictEqual(ctx.historyCalls.length, 1);
  assert.strictEqual(ctx.historyCalls[0][1], 'C');
  assert.strictEqual(ctx.badgeChecks, 1);
  assert.strictEqual(outcome.xpEarned, 20);
});

test('default (observer) mode stays read-only: no sequence run, no XP awarded', function() {
  var ctx = makeContext();
  var outcome = ctx.SparkProgressOrchestrator.applySessionOutcome({ mode: 'guided' });
  assert.strictEqual(ctx.S.sessions, 0, 'observer mode must not drive the sequence');
  assert.strictEqual(ctx.S.xp, 40, 'observer mode must not award XP');
  assert.strictEqual(outcome.xpEarned, 0);
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
