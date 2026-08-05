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

test('drive mode preserves drill and song types', function() {
  var ctx = makeContext();
  ctx.SparkProgressOrchestrator.applySessionOutcome({ mode: 'drill' }, { drive: true });
  ctx.SparkProgressOrchestrator.applySessionOutcome({ mode: 'song', songId: 'x' }, { drive: true });
  assert.strictEqual(ctx.processResultsCalls[0].type, 'drill');
  assert.strictEqual(ctx.processResultsCalls[1].type, 'song');
  assert.strictEqual(ctx.processResultsCalls[1].songId, 'x');
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
