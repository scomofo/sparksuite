// ===== ChordSpark Core Tests =====
// Run: node tests/test_core.js
// Tests pure functions that don't require DOM or Web Audio

var assert = require('assert');
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

// ===== Load source files (extract testable functions) =====
// Since these are browser globals, we eval them in our context
var fs = require('fs');
var path = require('path');

function loadJS(file) {
  var code = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  // Remove references to DOM APIs that don't exist in Node
  code = code.replace(/document\.\w+/g, 'undefined');
  code = code.replace(/window\.\w+/g, 'undefined');
  code = code.replace(/navigator\.\w+/g, 'undefined');
  code = code.replace(/localStorage\.\w+/g, 'undefined');
  return code;
}

// Set up minimal globals
global.AudioContext = null;
global.webkitAudioContext = null;
global.Audio = function() { return { preload: '', play: function() { return Promise.resolve(); } }; };
global.performance = { now: function() { return Date.now(); } };

// Load data.js (constants, chord definitions)
eval(loadJS('js/data.js'));

// Minimal state for ui.js
global.S = {
  soundOn: false, darkMode: false, chordProgress: {}, earnedBadges: [],
  sessionMicros: [], detectedNotes: [], chordMatch: -1
};
global.T = {};

// Stub audio functions that ui.js references
global.snd = function() {};
global.saveState = function() {};
global.render = function() {};

// Load ui.js (escHTML, checkBadges, shuffle, etc.)
eval(loadJS('js/ui.js'));

// ===== Tests: escHTML =====
console.log('\n--- escHTML ---');

test('escapes angle brackets', function() {
  assert.strictEqual(escHTML('<script>'), '&lt;script&gt;');
});

test('escapes ampersand', function() {
  assert.strictEqual(escHTML('A&B'), 'A&amp;B');
});

test('escapes quotes', function() {
  assert.strictEqual(escHTML('"hello"'), '&quot;hello&quot;');
});

test('handles numbers', function() {
  assert.strictEqual(escHTML(42), '42');
});

test('handles empty string', function() {
  assert.strictEqual(escHTML(''), '');
});

test('handles XSS attempt', function() {
  var result = escHTML('<img onerror="alert(1)">');
  assert.ok(result.indexOf('<') === -1, 'should not contain raw <');
});

// ===== Tests: shuffle =====
console.log('\n--- shuffle ---');

test('returns array of same length', function() {
  var arr = [1, 2, 3, 4, 5];
  var result = shuffle(arr);
  assert.strictEqual(result.length, 5);
});

test('does not modify original array', function() {
  var arr = [1, 2, 3];
  var copy = arr.slice();
  shuffle(arr);
  assert.deepStrictEqual(arr, copy);
});

test('contains same elements', function() {
  var arr = [1, 2, 3, 4];
  var result = shuffle(arr);
  assert.deepStrictEqual(result.slice().sort(), [1, 2, 3, 4]);
});

// ===== Tests: getChordTier =====
console.log('\n--- getChordTier ---');

test('returns none for 0 progress', function() {
  S.chordProgress = {};
  assert.strictEqual(getChordTier('E Major').tier, 'none');
});

test('returns bronze for 25+ progress', function() {
  S.chordProgress = { 'E Major': 30 };
  assert.strictEqual(getChordTier('E Major').tier, 'bronze');
});

test('returns silver for 50+ progress', function() {
  S.chordProgress = { 'E Major': 55 };
  assert.strictEqual(getChordTier('E Major').tier, 'silver');
});

test('returns gold for 75+ progress', function() {
  S.chordProgress = { 'E Major': 80 };
  assert.strictEqual(getChordTier('E Major').tier, 'gold');
});

// ===== Tests: checkBadges =====
console.log('\n--- checkBadges ---');

test('awards first_chord badge after 1 session', function() {
  S.earnedBadges = [];
  S.sessions = 1;
  S.streak = 0; S.level = 1; S.drillCount = 0; S.dailyDone = 0;
  S.quizCorrect = 0; S.songsPlayed = 0; S.newBadge = null;
  // checkBadges uses snd() which needs soundOn=false to be a no-op
  checkBadges();
  assert.ok(S.earnedBadges.indexOf('first_chord') !== -1, 'should earn first_chord');
});

test('does not duplicate badges', function() {
  S.earnedBadges = ['first_chord'];
  S.sessions = 1; S.newBadge = null;
  checkBadges();
  var count = S.earnedBadges.filter(function(b) { return b === 'first_chord'; }).length;
  assert.strictEqual(count, 1, 'should not duplicate');
});

// ===== Tests: CHORD_NOTES data integrity =====
console.log('\n--- CHORD_NOTES ---');

test('all ALL_CHORDS have CHORD_NOTES entries', function() {
  var missing = [];
  for (var i = 0; i < ALL_CHORDS.length; i++) {
    if (!CHORD_NOTES[ALL_CHORDS[i].name]) missing.push(ALL_CHORDS[i].name);
  }
  assert.strictEqual(missing.length, 0, 'Missing CHORD_NOTES for: ' + missing.join(', '));
});

test('all CHORD_NOTES values are arrays of valid note names', function() {
  for (var name in CHORD_NOTES) {
    var notes = CHORD_NOTES[name];
    assert.ok(Array.isArray(notes), name + ' should be array');
    for (var i = 0; i < notes.length; i++) {
      assert.ok(NOTE_NAMES.indexOf(notes[i]) !== -1, name + ': invalid note ' + notes[i]);
    }
  }
});

// ===== Tests: CHORD_NAME_MAP =====
console.log('\n--- CHORD_NAME_MAP ---');

test('common shorthand maps to full names', function() {
  assert.strictEqual(CHORD_NAME_MAP['C'], 'C Major');
  assert.strictEqual(CHORD_NAME_MAP['Am'], 'A Minor');
  assert.strictEqual(CHORD_NAME_MAP['G7'], 'G7');
  assert.strictEqual(CHORD_NAME_MAP['Em'], 'E Minor');
});

// ===== Tests: getScaleFrets =====
console.log('\n--- getScaleFrets ---');

test('returns positions for C major pentatonic', function() {
  var positions = getScaleFrets('C', 'pentatonic');
  assert.ok(positions.length > 0, 'should have positions');
  // Should include root notes
  var roots = positions.filter(function(p) { return p.isRoot; });
  assert.ok(roots.length > 0, 'should have root positions');
});

test('returns empty for unknown key', function() {
  var positions = getScaleFrets('Z', 'major');
  assert.strictEqual(positions.length, 0);
});

// ===== Tests: getTransitionTip =====
console.log('\n--- getTransitionTip ---');

test('returns tip for known transition', function() {
  var tip = getTransitionTip('E Major', 'A Major');
  assert.ok(tip !== null, 'should have tip');
  assert.ok(tip.length > 0);
});

test('returns reverse tip when direct not found', function() {
  var tip = getTransitionTip('A Major', 'E Major');
  assert.ok(tip !== null, 'should have reverse tip');
});

test('returns null for unknown transition', function() {
  var tip = getTransitionTip('E Major', 'B Minor');
  // May or may not have a tip, but should not throw
  assert.ok(tip === null || typeof tip === 'string');
});

// ===== Tests: CHORD_LEVEL_MAP derivation =====
console.log('\n--- CHORD_LEVEL_MAP ---');

test('is derived from CHORDS (Em is level 1)', function() {
  assert.strictEqual(CHORD_LEVEL_MAP['Em'], 1);
});

test('all chords in CHORDS have a level map entry', function() {
  for (var lvl = 1; lvl <= 8; lvl++) {
    var cs = CHORDS[lvl] || [];
    for (var i = 0; i < cs.length; i++) {
      assert.ok(CHORD_LEVEL_MAP[cs[i].short] !== undefined, cs[i].short + ' missing from CHORD_LEVEL_MAP');
      assert.strictEqual(CHORD_LEVEL_MAP[cs[i].short], lvl, cs[i].short + ' should be level ' + lvl);
    }
  }
});

// ===== Tests: ChordEngine =====
console.log('\n--- ChordEngine ---');

test('calculates C Major correctly', function() {
  var notes = ChordEngine.get('C', 'Major');
  assert.deepStrictEqual(notes, ['C', 'E', 'G']);
});

test('calculates A Minor correctly', function() {
  var notes = ChordEngine.get('A', 'Minor');
  assert.deepStrictEqual(notes, ['A', 'C', 'E']);
});

test('returns null for invalid root', function() {
  var notes = ChordEngine.get('Z', 'Major');
  assert.strictEqual(notes, null);
});

// ===== Tests: Data-driven badges =====
console.log('\n--- Data-driven badges ---');

test('all BADGES have check() except event-based', function() {
  var withCheck = BADGES.filter(function(b) { return typeof b.check === 'function'; });
  assert.ok(withCheck.length >= 8, 'should have at least 8 badges with check()');
});

test('badge check functions return boolean', function() {
  S.sessions = 0; S.streak = 0; S.level = 1; S.drillCount = 0;
  S.dailyDone = 0; S.quizCorrect = 0; S.songsPlayed = 0;
  for (var i = 0; i < BADGES.length; i++) {
    if (BADGES[i].check) {
      var result = BADGES[i].check();
      assert.strictEqual(typeof result, 'boolean', BADGES[i].id + ' check() should return boolean');
    }
  }
});

// ===== Tests: GUITAR_SESSIONS =====
console.log('\n--- GUITAR_SESSIONS ---');

test('has 22 session plans', function() {
  assert.strictEqual(GUITAR_SESSIONS.length, 22);
});

test('all sessions have required fields', function() {
  for (var i = 0; i < GUITAR_SESSIONS.length; i++) {
    var gs = GUITAR_SESSIONS[i];
    assert.ok(gs.num, 'session ' + i + ' needs num');
    assert.ok(gs.title, 'session ' + i + ' needs title');
    assert.ok(gs.spark, 'session ' + i + ' needs spark');
    assert.ok(gs.newMove, 'session ' + i + ' needs newMove');
    assert.ok(gs.victoryLap, 'session ' + i + ' needs victoryLap');
  }
});

test('session chords reference valid ALL_CHORDS entries', function() {
  var names = ALL_CHORDS.map(function(c) { return c.name; });
  for (var i = 0; i < GUITAR_SESSIONS.length; i++) {
    var chord = GUITAR_SESSIONS[i].newMove.chord;
    assert.ok(names.indexOf(chord) !== -1, 'session ' + GUITAR_SESSIONS[i].num + ' chord "' + chord + '" not in ALL_CHORDS');
  }
});

// ===== Tests: FINGER_EXERCISES =====
console.log('\n--- FINGER_EXERCISES ---');

test('has at least 8 exercises', function() {
  assert.ok(FINGER_EXERCISES.length >= 8);
});

test('all exercises have required fields', function() {
  for (var i = 0; i < FINGER_EXERCISES.length; i++) {
    var ex = FINGER_EXERCISES[i];
    assert.ok(ex.id, 'exercise ' + i + ' needs id');
    assert.ok(ex.name, 'exercise ' + i + ' needs name');
    assert.ok(ex.tier, 'exercise ' + i + ' needs tier');
    assert.ok(ex.duration > 0, 'exercise ' + i + ' needs positive duration');
  }
});

// ===== Summary =====
console.log('\n' + '='.repeat(40));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('='.repeat(40));
process.exit(failed > 0 ? 1 : 0);
