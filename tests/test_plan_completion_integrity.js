// ===== Plan Completion Integrity Tests =====
// Run: node tests/test_plan_completion_integrity.js
//
// "Mark Plan Complete" used to route a completed-session outcome to the
// progress orchestrator even when zero plan items were done — free XP.
// completePracticePlan now withholds the credit unless at least one item
// was actually completed, and the legacy history records skips honestly.

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
    console: console,
    Date: Date,
    Math: Math,
    JSON: JSON,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    S: {
      practicePlan: { items: opts.items || [] },
      practicePlanDate: '2026-06-10',
      practicePlanFocus: 'test',
      practicePlanHistory: [],
      practicePlanComplete: false
    },
    saveState: function() {},
    SparkSessionTypes: { FLOW_DAILY_PRACTICE: 'daily_practice' },
    SparkRecommendationsEngine: undefined
  };
  if (opts.withCore) {
    ctx.orchestratorCalls = [];
    ctx.sparkCore = {
      startSession: function() { return null; },
      completeSession: function(payload) { ctx.coreCompleted = true; ctx.corePayload = payload; }
    };
    ctx.SparkContracts = { createSessionResult: function(r) { return r; } };
    ctx.SparkProgressOrchestrator = { applySessionOutcome: function(r) { ctx.orchestratorCalls.push(r); } };
  }
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/practice/engine.js'), 'utf8'), ctx);
  return ctx;
}

console.log('=== Plan Completion Integrity Tests ===');

test('earned completion routes credit through the core alone (Phase 7)', function() {
  var ctx = makeContext({ withCore: true, items: [{ id: 'a', completed: true }, { id: 'b' }] });
  ctx.completePracticePlan();
  assert.strictEqual(ctx.coreCompleted, true, 'plan should still be marked done in the core');
  assert.strictEqual(ctx.corePayload.earnedCompletion, true, 'core must be told the completion was earned');
  assert.strictEqual(ctx.orchestratorCalls.length, 0, 'core is the single driver — no shadow observer call');
});

test('zero items done marks the plan finished but earns nothing', function() {
  var ctx = makeContext({ withCore: true, items: [{ id: 'a' }, { id: 'b' }] });
  ctx.completePracticePlan();
  assert.strictEqual(ctx.coreCompleted, true, 'plan should still be marked done so the UI stops nagging');
  // The real ProgressEngine.completeSession reads this flag to withhold the
  // plan-completion XP/toast — covered end-to-end in
  // test_sparksuite_core_migration.js ("unearned completion ... without reward").
  assert.strictEqual(ctx.corePayload.earnedCompletion, false, 'core must be told nothing was earned');
  assert.strictEqual(ctx.orchestratorCalls.length, 0, 'no credit without doing anything');
});

test('legacy path records unearned completion as a skip', function() {
  var ctx = makeContext({ items: [{ id: 'a' }] });
  ctx.completePracticePlan();
  assert.strictEqual(ctx.S.practicePlanComplete, true);
  assert.strictEqual(ctx.S.practicePlanHistory[0].skipped, true);
});

test('legacy path records earned completion honestly', function() {
  var ctx = makeContext({ items: [{ id: 'a', completed: 1 }] });
  ctx.completePracticePlan();
  assert.strictEqual(ctx.S.practicePlanHistory[0].skipped, false);
});

test('string "true" and numeric 1 count as completed items', function() {
  var ctx = makeContext({ items: [{ completed: 'true' }] });
  assert.strictEqual(ctx.practicePlanHasEarnedCompletion(), true);
  var ctx2 = makeContext({ items: [{ completed: 0 }, { completed: 'no' }] });
  assert.strictEqual(ctx2.practicePlanHasEarnedCompletion(), false);
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
