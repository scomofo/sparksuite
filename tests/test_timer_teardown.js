// Regression test for instrument-switch timer leaks (bug #5):
// SparkInstruments.deactivate() must clear the piano mini-game intervals
// (T.rhythm/T.runner/T.build) and reset their active flags, so a running game
// can't keep ticking (sound + re-renders) on the next instrument.
var assert = require('assert');
var fs = require('fs');
var path = require('path');

global.window = global;
global.localStorage = (function() {
  var s = {};
  return { getItem: function(k) { return s[k] || null; }, setItem: function(k, v) { s[k] = String(v); }, removeItem: function(k) { delete s[k]; }, clear: function() { s = {}; } };
})();
global.SparkProfile = {
  createEmpty: function() { return { schemaVersion: 1, apps: {}, suiteRewards: { badges: [], cosmetics: [], challengeProgress: {} } }; },
  ensureApp: function(p, a, i) { p.apps = p.apps || {}; if (!p.apps[a]) p.apps[a] = { instrument: i, stats: { level: 1, xp: 0, streakDays: 0 } }; }
};
global.SparkStorage = { load: function() { return SparkProfile.createEmpty(); } };
global.SparkHighway = { GUITAR_SKIN: { laneCount: 6 }, PIANO_SKIN: { laneCount: 24 } };
global.escHTML = function(s) { return String(s); };
global.SCR = { HOME: 'home' };
global.TAB = { PRACTICE: 'practice', SONGS: 'songs' };
global.S = { completedLessons: [], mastery: { rhythm: {} } };
global.T = {};

function loadJS(file) { return fs.readFileSync(path.join(__dirname, '..', file), 'utf8'); }
eval(loadJS('js/launcher.js'));

function test(name, fn) {
  try { fn(); console.log('  PASS: ' + name); }
  catch (e) { console.error('  FAIL: ' + name + '\n    ' + e.message); process.exitCode = 1; }
}

console.log('\n--- Timer teardown on deactivate ---');

test('deactivate() clears piano game intervals and resets their active flags', function() {
  var cleared = [];
  var origClear = global.clearInterval;
  try {
    global.clearInterval = function(id) { cleared.push(id); };

    global.T.rhythm = 101; global.T.runner = 102; global.T.build = 103;
    global.S.rhythmActive = true; global.S.runnerActive = true; global.S.buildPlaying = true;

    SparkInstruments.deactivate();
  } finally {
    // Always restore the global mock, even if an assertion throws, so it can't
    // pollute later tests.
    global.clearInterval = origClear;
  }

  assert.ok(cleared.indexOf(101) !== -1, 'T.rhythm interval should be cleared');
  assert.ok(cleared.indexOf(102) !== -1, 'T.runner interval should be cleared');
  assert.ok(cleared.indexOf(103) !== -1, 'T.build interval should be cleared');
  assert.strictEqual(global.T.rhythm, null);
  assert.strictEqual(global.T.runner, null);
  assert.strictEqual(global.T.build, null);
  assert.strictEqual(global.S.rhythmActive, false);
  assert.strictEqual(global.S.runnerActive, false);
  assert.strictEqual(global.S.buildPlaying, false);
});
