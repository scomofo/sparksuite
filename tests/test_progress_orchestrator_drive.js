// ===== Progress Orchestrator Drive Mode Tests =====
// Run: node tests/test_progress_orchestrator_drive.js
//
// Phase 7 retirement: applySessionOutcome(sessionResult, { drive: true }) makes
// the orchestrator the single progression entry point for retired flows — it
// runs the progression sequence exactly once and returns a real ProgressOutcome
// with renderer effect data on .sessionEffects. Without the flag it must stay a
// read-only observer (the not-yet-retired dual-path flows depend on that).

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

function makeContext(opts) {
  opts = opts || {};
  var ctx = {
    console: { debug: function() {} },
    Date: Date,
    Math: Math,
    JSON: JSON,
    S: { xp: 40, level: 2, playerLevel: 2 }
  };
  if (!opts.withoutSession) {
    ctx.processResultsCalls = [];
    ctx.SparkSession = {
      processResults: function(results) {
        ctx.processResultsCalls.push(results);
        return opts.effects || {
          xpEarned: 10, jackpot: false, leveledUp: false,
          newLevel: 2, newBadges: [], streakUpdated: false
        };
      }
    };
  }
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/spark-core/runtime/contracts.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/spark-core/progress-orchestrator.js'), 'utf8'), ctx);
  return ctx;
}

console.log('=== Progress Orchestrator Drive Mode Tests ===');

test('drive mode runs the progression sequence exactly once', function() {
  var ctx = makeContext();
  var result = ctx.SparkContracts.createSessionResult({
    mode: 'quickStart', chordName: 'Am', duration: 120, accuracy: 0.75, completed: true
  });
  ctx.SparkProgressOrchestrator.applySessionOutcome(result, { drive: true });
  assert.strictEqual(ctx.processResultsCalls.length, 1, 'processResults must run exactly once');
});

test('drive mode maps quickStart/chord modes to legacy type "session"', function() {
  var ctx = makeContext();
  ctx.SparkProgressOrchestrator.applySessionOutcome({ mode: 'quickStart', chordName: 'Am' }, { drive: true });
  ctx.SparkProgressOrchestrator.applySessionOutcome({ mode: 'chord', chordName: 'Em' }, { drive: true });
  assert.strictEqual(ctx.processResultsCalls[0].type, 'session');
  assert.strictEqual(ctx.processResultsCalls[0].chordName, 'Am');
  assert.strictEqual(ctx.processResultsCalls[1].type, 'session');
});

test('drive mode preserves the song type for the session sequence', function() {
  var ctx = makeContext();
  ctx.SparkProgressOrchestrator.applySessionOutcome({ mode: 'song', songId: 'x' }, { drive: true });
  assert.strictEqual(ctx.processResultsCalls[0].type, 'song');
  assert.strictEqual(ctx.processResultsCalls[0].songId, 'x');
});

test('drive mode routes drill through the activity completion sequence, not processResults', function() {
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
  assert.strictEqual(ctx.processResultsCalls.length, 0, 'drill must not run the session sequence');
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
  assert.strictEqual(ctx.processResultsCalls.length, 0);
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
  ctx.historyCalls = [];
  ctx.logHistory = function(type, detail, xp) { ctx.historyCalls.push([type, detail, xp]); };
  ctx.badgeChecks = 0;
  ctx.checkBadges = function() { ctx.badgeChecks++; };
  ctx.saveState = function() {};
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

test('drive mode returns a ProgressOutcome mapped from the sequence effects', function() {
  var ctx = makeContext({
    effects: {
      xpEarned: 50, jackpot: true, leveledUp: true,
      newLevel: 3, newBadges: ['first_week'], streakUpdated: true
    }
  });
  var outcome = ctx.SparkProgressOrchestrator.applySessionOutcome({ mode: 'quickStart' }, { drive: true });
  assert.strictEqual(outcome.xpEarned, 50);
  assert.strictEqual(outcome.levelUps.length, 1);
  assert.strictEqual(outcome.levelUps[0], 3);
  assert.strictEqual(outcome.achievements.length, 1);
  assert.strictEqual(outcome.achievements[0], 'first_week');
  assert.ok(outcome.streakChanges, 'streak change must be reported');
  assert.strictEqual(outcome.sessionEffects.jackpot, true, 'renderer effects ride on sessionEffects');
  assert.strictEqual(outcome.sessionEffects.leveledUp, true);
});

test('drive mode without SparkSession loaded returns zeroed effects without throwing', function() {
  var ctx = makeContext({ withoutSession: true });
  var outcome = ctx.SparkProgressOrchestrator.applySessionOutcome({ mode: 'quickStart' }, { drive: true });
  assert.strictEqual(outcome.xpEarned, 0);
  assert.strictEqual(outcome.sessionEffects.newLevel, 2, 'falls back to current S.level');
});

test('default (observer) mode stays read-only: no processResults call, no XP awarded', function() {
  var ctx = makeContext();
  var outcome = ctx.SparkProgressOrchestrator.applySessionOutcome({ mode: 'guided' });
  assert.strictEqual(ctx.processResultsCalls.length, 0, 'observer mode must not drive the sequence');
  assert.strictEqual(outcome.xpEarned, 0, 'observer mode must not award XP');
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
