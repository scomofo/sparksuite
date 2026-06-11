// ===== Streak Protection Tests =====
// Run: node tests/test_streak_protection.js
//
// A streak freeze covers exactly one missed day and regenerates 7 days
// after it was last consumed. These tests eval js/state.js standalone
// and drive checkStreak() across the scenarios.

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

function loadSource(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
}

function makeContext() {
  var store = {};
  var ctx = {
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    Date: Date,
    Math: Math,
    JSON: JSON,
    localStorage: {
      getItem: function(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
      setItem: function(k, v) { store[k] = String(v); },
      removeItem: function(k) { delete store[k]; }
    },
    SCR: { HOME: 'home' },
    TAB: { PRACTICE: 'practice' }
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(loadSource('js/state.js'), ctx);
  return ctx;
}

function isoDaysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString().split('T')[0];
}

console.log('=== Streak Protection Tests ===');

test('same-day and next-day sessions never touch the streak', function() {
  var ctx = makeContext();
  ctx.S.streak = 5;
  ctx.S.lastSessionDate = isoDaysAgo(0);
  ctx.checkStreak();
  assert.strictEqual(ctx.S.streak, 5);
  ctx.S.lastSessionDate = isoDaysAgo(1);
  ctx.checkStreak();
  assert.strictEqual(ctx.S.streak, 5);
  assert.strictEqual(ctx.S.streakFreezeUsedAt, null, 'freeze should not be consumed');
});

test('one missed day consumes the freeze and keeps the streak', function() {
  var ctx = makeContext();
  ctx.S.streak = 9;
  ctx.S.lastSessionDate = isoDaysAgo(2);
  ctx.S.streakFreezeUsedAt = null;
  ctx.checkStreak();
  assert.strictEqual(ctx.S.streak, 9, 'streak should survive');
  assert.ok(ctx.S.streakFreezeUsedAt, 'freeze should be marked used');
  assert.ok(ctx.S.microToast && /freeze/i.test(ctx.S.microToast.msg), 'should announce the freeze');
  assert.strictEqual(ctx.S.lastSessionDate, isoDaysAgo(1), 'missed day should be credited as a virtual session');
});

test('re-running checkStreak the same day does not undo the freeze', function() {
  var ctx = makeContext();
  ctx.S.streak = 9;
  ctx.S.lastSessionDate = isoDaysAgo(2);
  ctx.S.streakFreezeUsedAt = null;
  ctx.checkStreak();
  assert.strictEqual(ctx.S.streak, 9);
  // App reopened / state reloaded later the same day — the freeze is on
  // cooldown now, but the protected streak must not be wiped.
  ctx.checkStreak();
  ctx.checkStreak();
  assert.strictEqual(ctx.S.streak, 9, 'streak must survive same-day re-checks');
});

test('one missed day with freeze on cooldown resets the streak', function() {
  var ctx = makeContext();
  ctx.S.streak = 9;
  ctx.S.lastSessionDate = isoDaysAgo(2);
  ctx.S.streakFreezeUsedAt = isoDaysAgo(3); // used 3 days ago, needs 7
  ctx.checkStreak();
  assert.strictEqual(ctx.S.streak, 0);
});

test('freeze regenerates 7 days after use', function() {
  var ctx = makeContext();
  ctx.S.streak = 4;
  ctx.S.lastSessionDate = isoDaysAgo(2);
  ctx.S.streakFreezeUsedAt = isoDaysAgo(8);
  ctx.checkStreak();
  assert.strictEqual(ctx.S.streak, 4, 'regenerated freeze should save the streak');
  assert.strictEqual(ctx.S.streakFreezeUsedAt, isoDaysAgo(0), 'freeze use date should update');
});

test('two or more missed days reset the streak even with a freeze', function() {
  var ctx = makeContext();
  ctx.S.streak = 12;
  ctx.S.lastSessionDate = isoDaysAgo(3);
  ctx.S.streakFreezeUsedAt = null;
  ctx.checkStreak();
  assert.strictEqual(ctx.S.streak, 0, 'a freeze only covers a single missed day');
  assert.strictEqual(ctx.S.streakFreezeUsedAt, null, 'freeze should not be wasted on a lost cause');
});

test('zero streak never consumes the freeze', function() {
  var ctx = makeContext();
  ctx.S.streak = 0;
  ctx.S.lastSessionDate = isoDaysAgo(2);
  ctx.checkStreak();
  assert.strictEqual(ctx.S.streakFreezeUsedAt, null);
});

test('streakFreezeUsedAt is persisted', function() {
  var ctx = makeContext();
  ctx.S.streakFreezeUsedAt = isoDaysAgo(1);
  ctx.saveState(true);
  var raw = JSON.parse(ctx.localStorage.getItem('chordspark_state'));
  assert.strictEqual(raw.streakFreezeUsedAt, isoDaysAgo(1));
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
