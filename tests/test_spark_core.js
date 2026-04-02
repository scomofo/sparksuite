// tests/test_spark_core.js
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log('  PASS: ' + name); }
  catch (e) { failed++; console.error('  FAIL: ' + name + '\n    ' + e.message); }
}

// Minimal globals for eval
global.window = global;
global.localStorage = (function() {
  var store = {};
  return {
    getItem: function(k) { return store[k] || null; },
    setItem: function(k, v) { store[k] = String(v); },
    removeItem: function(k) { delete store[k]; },
    clear: function() { store = {}; }
  };
})();

function loadJS(file) {
  var code = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  return code;
}

eval(loadJS('js/spark-core/profile-schema.js'));
eval(loadJS('js/spark-core/storage.js'));

console.log('\n--- SparkCore: Profile Schema ---');

test('createEmptySuiteProfile returns valid shape', function() {
  var p = SparkProfile.createEmpty();
  assert.strictEqual(p.schemaVersion, 1);
  assert.strictEqual(p.suite, 'spark');
  assert.ok(p.apps);
  assert.ok(p.suiteRewards);
});

test('ensureAppProfile adds missing app', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  assert.ok(p.apps.chordspark);
  assert.strictEqual(p.apps.chordspark.instrument, 'guitar');
  assert.strictEqual(p.apps.chordspark.stats.xp, 0);
});

test('ensureAppProfile does not overwrite existing app', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  p.apps.chordspark.stats.xp = 500;
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  assert.strictEqual(p.apps.chordspark.stats.xp, 500);
});

test('migrateProfile upgrades missing fields', function() {
  var p = { schemaVersion: 1, suite: 'spark', apps: {} };
  SparkProfile.migrate(p);
  assert.ok(p.suiteRewards);
  assert.ok(p.suiteRewards.badges);
});

console.log('\n--- SparkCore: Storage ---');

test('saveSuiteProfile and loadSuiteProfile roundtrip', function() {
  localStorage.clear();
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  p.apps.chordspark.stats.xp = 42;
  SparkStorage.save(p);
  var loaded = SparkStorage.load();
  assert.strictEqual(loaded.apps.chordspark.stats.xp, 42);
});

test('loadSuiteProfile returns empty profile when nothing saved', function() {
  localStorage.clear();
  var loaded = SparkStorage.load();
  assert.strictEqual(loaded.schemaVersion, 1);
  assert.ok(loaded.apps);
});

eval(loadJS('js/spark-core/events.js'));

console.log('\n--- SparkCore: Events ---');

test('emitSparkEvent adds to pending queue', function() {
  SparkEvents.clear();
  SparkEvents.emit('lesson_completed', { appId: 'chordspark', lessonId: 'test1' });
  var pending = SparkEvents.getPending();
  assert.strictEqual(pending.length, 1);
  assert.strictEqual(pending[0].type, 'lesson_completed');
  assert.strictEqual(pending[0].payload.lessonId, 'test1');
});

test('clearPendingSparkEvents empties queue', function() {
  SparkEvents.emit('test', {});
  SparkEvents.clear();
  assert.strictEqual(SparkEvents.getPending().length, 0);
});

test('events have timestamps', function() {
  SparkEvents.clear();
  SparkEvents.emit('streak_updated', { days: 3 });
  var evt = SparkEvents.getPending()[0];
  assert.ok(evt.timestamp > 0);
});

test('onSparkEvent listener fires', function() {
  var received = null;
  SparkEvents.on('xp_awarded', function(evt) { received = evt; });
  SparkEvents.emit('xp_awarded', { amount: 10 });
  assert.ok(received);
  assert.strictEqual(received.payload.amount, 10);
  SparkEvents.off('xp_awarded');
  SparkEvents.clear();
});

eval(loadJS('js/spark-core/progress-engine.js'));

console.log('\n--- SparkCore: Progress Engine ---');

test('awardXp adds to app stats', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  SparkProgress.awardXp(p, 'chordspark', 25);
  assert.strictEqual(p.apps.chordspark.stats.xp, 25);
});

test('awardXp accumulates', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  SparkProgress.awardXp(p, 'chordspark', 10);
  SparkProgress.awardXp(p, 'chordspark', 15);
  assert.strictEqual(p.apps.chordspark.stats.xp, 25);
});

test('completeLesson marks lesson done and awards xp', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  SparkProgress.completeLesson(p, 'chordspark', 'lesson_1', { xp: 25, accuracy: 90 });
  assert.ok(p.apps.chordspark.completedLessonIds.indexOf('lesson_1') >= 0);
  assert.strictEqual(p.apps.chordspark.stats.lessonsCompleted, 1);
  assert.strictEqual(p.apps.chordspark.stats.xp, 25);
});

test('completeLesson is idempotent', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  SparkProgress.completeLesson(p, 'chordspark', 'lesson_1', { xp: 25 });
  SparkProgress.completeLesson(p, 'chordspark', 'lesson_1', { xp: 25 });
  assert.strictEqual(p.apps.chordspark.completedLessonIds.length, 1);
  assert.strictEqual(p.apps.chordspark.stats.lessonsCompleted, 1);
  assert.strictEqual(p.apps.chordspark.stats.xp, 25);
});

test('completeSession increments session count', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  SparkProgress.completeSession(p, 'chordspark', 'practice', { xp: 10 });
  assert.strictEqual(p.apps.chordspark.stats.sessionsCompleted, 1);
  assert.strictEqual(p.apps.chordspark.stats.xp, 10);
});

test('updateStreak increments on new day', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  p.apps.chordspark._lastStreakDate = '2026-03-30';
  SparkProgress.updateStreak(p, 'chordspark', '2026-03-31');
  assert.strictEqual(p.apps.chordspark.stats.streakDays, 1);
});

test('updateStreak resets on gap day', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  p.apps.chordspark.stats.streakDays = 5;
  p.apps.chordspark._lastStreakDate = '2026-03-28';
  SparkProgress.updateStreak(p, 'chordspark', '2026-03-31');
  assert.strictEqual(p.apps.chordspark.stats.streakDays, 1);
});

test('updateStreak no-ops on same day', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  p.apps.chordspark.stats.streakDays = 3;
  p.apps.chordspark._lastStreakDate = '2026-03-31';
  SparkProgress.updateStreak(p, 'chordspark', '2026-03-31');
  assert.strictEqual(p.apps.chordspark.stats.streakDays, 3);
});

test('unlock adds to unlockedIds', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  SparkProgress.unlock(p, 'chordspark', 'drill_open_chords_1');
  assert.ok(p.apps.chordspark.unlockedIds.indexOf('drill_open_chords_1') >= 0);
});

test('unlock is idempotent', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  SparkProgress.unlock(p, 'chordspark', 'item_1');
  SparkProgress.unlock(p, 'chordspark', 'item_1');
  assert.strictEqual(p.apps.chordspark.unlockedIds.length, 1);
});

test('recordDrillAnswer updates mastery', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  SparkProgress.recordDrillAnswer(p, 'chordspark', 'chord_em', true, 90);
  assert.ok(p.apps.chordspark.mastery['chord_em'] > 0);
});

eval(loadJS('js/spark-core/achievements.js'));

console.log('\n--- SparkCore: Achievements ---');

test('evaluateAchievements returns empty for fresh profile', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  var earned = SparkAchievements.evaluate(p);
  assert.strictEqual(earned.length, 0);
});

test('evaluateAchievements awards first_lesson', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  p.apps.chordspark.stats.lessonsCompleted = 1;
  var earned = SparkAchievements.evaluate(p);
  assert.ok(earned.indexOf('first_lesson') >= 0);
});

test('evaluateAchievements awards streak_3', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  p.apps.chordspark.stats.streakDays = 3;
  var earned = SparkAchievements.evaluate(p);
  assert.ok(earned.indexOf('streak_3') >= 0);
});

test('evaluateAchievements awards dual_instrument when both apps have lessons', function() {
  var p = SparkProfile.createEmpty();
  SparkProfile.ensureApp(p, 'chordspark', 'guitar');
  SparkProfile.ensureApp(p, 'pianospark', 'piano');
  p.apps.chordspark.stats.lessonsCompleted = 1;
  p.apps.pianospark.stats.lessonsCompleted = 1;
  var earned = SparkAchievements.evaluate(p);
  assert.ok(earned.indexOf('dual_instrument_starter') >= 0);
});

eval(loadJS('js/spark-core/content-schema.js'));
eval(loadJS('js/spark-core/content-normalizer.js'));

console.log('\n--- SparkCore: Content ---');

test('validateContent rejects missing appId', function() {
  var result = SparkContent.validate({ schemaVersion: 1, units: [] });
  assert.strictEqual(result.valid, false);
});

test('validateContent accepts valid content', function() {
  var result = SparkContent.validate({
    schemaVersion: 1, appId: 'chordspark', instrument: 'guitar', title: 'Test', units: []
  });
  assert.strictEqual(result.valid, true);
});

test('normalizeChordSparkContent converts GUITAR_SESSIONS shape', function() {
  var raw = [{ num: 1, title: 'Test Session', level: 1, bpm: 60,
    spark: { chord: 'E Minor', desc: 'test' },
    newMove: { chord: 'E Minor', desc: 'test' },
    victoryLap: { drill: '2chord', chords: ['E Minor'] }
  }];
  var content = SparkContentNormalizer.fromChordSparkSessions(raw, 'chordspark');
  assert.strictEqual(content.appId, 'chordspark');
  assert.strictEqual(content.units.length, 1);
  assert.ok(content.units[0].lessons.length > 0);
});

test('getLessonById finds lesson', function() {
  var content = {
    units: [{ id: 'u1', lessons: [{ id: 'L1', title: 'Test' }] }]
  };
  var lesson = SparkContentNormalizer.getLessonById(content, 'L1');
  assert.ok(lesson);
  assert.strictEqual(lesson.title, 'Test');
});

test('getLessonById returns null for missing', function() {
  var content = { units: [{ id: 'u1', lessons: [] }] };
  assert.strictEqual(SparkContentNormalizer.getLessonById(content, 'nope'), null);
});

// ===== Summary =====
console.log('\n' + '='.repeat(40));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('='.repeat(40));
process.exit(failed > 0 ? 1 : 0);
