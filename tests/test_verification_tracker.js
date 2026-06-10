// ===== Verification Tracker Tests =====
// Run: node tests/test_verification_tracker.js
//
// The mic-verified Try step in guided sessions uses this tracker: a chord
// match must hold at/above the threshold continuously for holdMs before
// the step verifies. Spikes and dropouts must not count.

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

var ctx = { window: {} };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/utils/verification_tracker.js'), 'utf8'), ctx);

console.log('=== Verification Tracker Tests ===');

test('verifies after a sustained hold at threshold', function() {
  var t = ctx.createVerificationTracker({ threshold: 75, holdMs: 1200 });
  assert.strictEqual(t.update(80, 0), false);
  assert.strictEqual(t.update(85, 600), false);
  assert.strictEqual(t.update(78, 1200), true);
  assert.strictEqual(t.isVerified(), true);
});

test('a momentary spike does not verify', function() {
  var t = ctx.createVerificationTracker({ threshold: 75, holdMs: 1200 });
  assert.strictEqual(t.update(95, 0), false);
  assert.strictEqual(t.update(95, 1100), false);
  assert.strictEqual(t.isVerified(), false);
});

test('a dropout resets the hold', function() {
  var t = ctx.createVerificationTracker({ threshold: 75, holdMs: 1000 });
  t.update(90, 0);
  t.update(90, 800);
  t.update(40, 900);   // dropped below threshold — restart
  assert.strictEqual(t.update(90, 1000), false);
  assert.strictEqual(t.update(90, 1900), false);
  assert.strictEqual(t.update(90, 2000), true);
});

test('non-numeric and -1 matches never count', function() {
  var t = ctx.createVerificationTracker({ threshold: 75, holdMs: 500 });
  assert.strictEqual(t.update(-1, 0), false);
  assert.strictEqual(t.update(undefined, 600), false);
  assert.strictEqual(t.update(null, 1200), false);
  assert.strictEqual(t.isVerified(), false);
});

test('progress reports the hold fraction and pins at 1 when verified', function() {
  var t = ctx.createVerificationTracker({ threshold: 75, holdMs: 1000 });
  assert.strictEqual(t.progress(0), 0);
  t.update(90, 0);
  assert.ok(Math.abs(t.progress(500) - 0.5) < 0.01);
  t.update(90, 1000);
  assert.strictEqual(t.progress(2000), 1);
});

test('reset clears verification and hold', function() {
  var t = ctx.createVerificationTracker({ threshold: 75, holdMs: 100 });
  t.update(90, 0);
  t.update(90, 100);
  assert.strictEqual(t.isVerified(), true);
  t.reset();
  assert.strictEqual(t.isVerified(), false);
  assert.strictEqual(t.progress(200), 0);
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
