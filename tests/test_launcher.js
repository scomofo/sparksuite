// tests/test_launcher.js
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log('  PASS: ' + name); }
  catch (e) { failed++; console.error('  FAIL: ' + name + '\n    ' + e.message); }
}

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
global.SparkProfile = {
  createEmpty: function() { return { schemaVersion: 1, suite: 'spark', userId: 'local-user', apps: {}, suiteRewards: { badges: [], cosmetics: [], challengeProgress: {} } }; },
  ensureApp: function(profile, appId, instrument) {
    profile.apps = profile.apps || {};
    if (!profile.apps[appId]) {
      profile.apps[appId] = { instrument: instrument, stats: { level: 1, xp: 0, streakDays: 0 } };
    }
  }
};
global.SparkStorage = { load: function() { return SparkProfile.createEmpty(); } };
global.SparkHighway = { GUITAR_SKIN: { laneCount: 6 }, PIANO_SKIN: { laneCount: 24 } };
global.escHTML = function(s) { return String(s); };
global.SCR = { HOME: 'home' };
global.TAB = { PRACTICE: 'practice' };
global.S = { completedLessons: [], mastery: { rhythm: {} }, activeInstrument: null, screen: null, tab: null };
global.__sparkState = global.S;
global.SparkState = {
  getRoot: function() { return global.S; },
  write: function(path, value) {
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = global.S;
    var i;
    for (i = 0; i < parts.length - 1; i++) {
      if (!cursor[parts[i]] || typeof cursor[parts[i]] !== 'object') cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
    return value;
  }
};
global.saveStateCalls = 0;
global.saveState = function() { saveStateCalls++; };
global.renderCalls = 0;
global.render = function() { renderCalls++; };

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
}

eval(loadJS('js/launcher.js'));

console.log('\n--- SparkSuite: Launcher ---');

test('SparkInstruments starts with no instruments', function() {
  assert.strictEqual(SparkInstruments.getAll().length, 0);
});

test('register adds an instrument', function() {
  SparkInstruments.register({
    id: 'test_guitar', instrument: 'guitar', name: 'Guitar', icon: 'G',
    skin: SparkHighway.GUITAR_SKIN, available: true,
    getData: function() { return {}; },
    pages: { home: function() { return '<div>Guitar Home</div>'; } },
    tabs: ['practice'], stemMutePreset: {}, init: function() {}
  });
  assert.strictEqual(SparkInstruments.getAll().length, 1);
  assert.strictEqual(SparkInstruments.getAll()[0].id, 'test_guitar');
});

test('register adds a second instrument', function() {
  SparkInstruments.register({
    id: 'test_piano', instrument: 'piano', name: 'Piano', icon: 'P',
    skin: SparkHighway.PIANO_SKIN, available: true,
    getData: function() { return {}; },
    pages: { home: function() { return '<div>Piano Home</div>'; } },
    tabs: ['practice'], stemMutePreset: {}, init: function() {}
  });
  assert.strictEqual(SparkInstruments.getAll().length, 2);
});

test('register ignores duplicates', function() {
  SparkInstruments.register({
    id: 'test_guitar', instrument: 'guitar', name: 'Guitar2', icon: 'G2',
    skin: null, available: true, getData: function() { return {}; },
    pages: {}, tabs: [], stemMutePreset: {}, init: function() {}
  });
  assert.strictEqual(SparkInstruments.getAll().length, 2);
});

test('activate sets active instrument', function() {
  SparkInstruments.activate('test_guitar');
  var active = SparkInstruments.getActive();
  assert.ok(active);
  assert.strictEqual(active.id, 'test_guitar');
});

test('deactivate clears active instrument', function() {
  SparkInstruments.deactivate();
  assert.strictEqual(SparkInstruments.getActive(), null);
});

test('openInstrumentFromLauncher updates shared launcher state', function() {
  renderCalls = 0;
  saveStateCalls = 0;
  openInstrumentFromLauncher('test_guitar');
  assert.strictEqual(S.activeInstrument, 'test_guitar');
  assert.strictEqual(S.screen, 'home');
  assert.strictEqual(S.tab, 'practice');
  assert.strictEqual(renderCalls, 1);
  assert.strictEqual(saveStateCalls, 1);
});

test('returnToLauncherFromHeader clears active instrument and rerenders', function() {
  renderCalls = 0;
  saveStateCalls = 0;
  SparkInstruments.activate('test_guitar');
  S.activeInstrument = 'test_guitar';
  returnToLauncherFromHeader();
  assert.strictEqual(SparkInstruments.getActive(), null);
  assert.strictEqual(S.activeInstrument, null);
  assert.strictEqual(S.screen, 'home');
  assert.strictEqual(S.tab, 'practice');
  assert.strictEqual(renderCalls, 1);
  assert.strictEqual(saveStateCalls, 1);
});

test('header logo routes through the shared goHome action', function() {
  var indexHtml = loadJS('index.html');
  assert.ok(/onclick="act\('goHome'\)"/.test(indexHtml));
});

test('launcher back routes through the shared returnToLauncher action', function() {
  var indexHtml = loadJS('index.html');
  assert.ok(/onclick="event\.stopPropagation\(\);act\('returnToLauncher'\)"/.test(indexHtml));
});

test('launcher cards route through the shared openInstrument action', function() {
  var launcherJs = loadJS('js/launcher.js');
  assert.ok(launcherJs.indexOf('onclick="act(\\\'openInstrument\\\',\\\'') >= 0);
});

test('getPage returns page from active instrument', function() {
  SparkInstruments.activate('test_guitar');
  var page = SparkInstruments.getPage('home');
  assert.ok(page);
  assert.strictEqual(typeof page, 'function');
});

test('getPage returns null for missing page', function() {
  SparkInstruments.activate('test_guitar');
  assert.strictEqual(SparkInstruments.getPage('nonexistent'), null);
});

test('getPage returns null when no active instrument', function() {
  SparkInstruments.deactivate();
  assert.strictEqual(SparkInstruments.getPage('home'), null);
});

test('renderLauncher returns HTML with instrument cards', function() {
  var html = SparkInstruments.renderLauncher();
  assert.ok(html.indexOf('Guitar') >= 0);
  assert.ok(html.indexOf('Piano') >= 0);
  assert.ok(html.indexOf('SparkSuite') >= 0);
});

test('ukulele register adds a selectable launcher instrument', function() {
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_skill_tree.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_lessons.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_chords.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_scales.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_tuning.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_exercises.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_progression.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_module.js'));
  eval(loadJS('js/instruments/ukulele/register.js'));

  var all = SparkInstruments.getAll();
  var ukulele = null;
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === 'ukespark') ukulele = all[i];
  }

  assert.ok(ukulele);
  assert.strictEqual(ukulele.instrument, 'ukulele');
  assert.strictEqual(typeof ukulele.tabRenderers.practice, 'function');
});

test('ukulele register prefers sparkCore progress view for practice and stats rendering', function() {
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_skill_tree.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_lessons.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_chords.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_scales.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_tuning.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_exercises.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_progression.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_module.js'));
  eval(loadJS('js/instruments/ukulele/register.js'));

  global.ukuleleSVG = function(chordObj) {
    return '<div>' + (chordObj && chordObj.name ? chordObj.name : '') + '</div>';
  };
  global.S.completedLessons = [];
  global.S.mastery = { rhythm: {} };
  global.sparkCore = {
    getInstrumentProgressView: function(instrumentId) {
      assert.strictEqual(instrumentId, 'ukulele');
      return {
        instrument: 'ukulele',
        completedLessonIds: ['uke_01', 'uke_02'],
        masteryLessonIds: [],
        rhythmMastery: { island_strum: 35, fingerpicking: 22 },
        rhythmSkillIds: ['island_strum', 'fingerpicking'],
        namedSkillProgress: {},
        namedSkillIds: []
      };
    }
  };

  var all = SparkInstruments.getAll();
  var ukulele = null;
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === 'ukespark') ukulele = all[i];
  }

  assert.ok(ukulele);
  var practiceHtml = ukulele.tabRenderers.practice();
  var statsHtml = ukulele.tabRenderers.stats();
  assert.ok(practiceHtml.indexOf('Ukulele Practice') >= 0);
  assert.ok(statsHtml.indexOf('Lessons completed: 2') >= 0);
  assert.ok(statsHtml.indexOf('Rhythm skills tracked: 2') >= 0);
});

test('bass register exposes a dedicated songs tab renderer', function() {
  global.getPerformanceChartLibrary = function(options) {
    if (options && options.instrument === 'bass') {
      return [{ id: 'bass_midnight_lock_package', title: 'Midnight Lock', artist: 'SparkSuite Bass', bpm: 75 }];
    }
    return [];
  };
  eval(loadJS('js/instruments/bass/data.js'));
  eval(loadJS('js/sparksuite/instruments/bass/bass_module.js'));
  eval(loadJS('js/instruments/bass/register.js'));

  var all = SparkInstruments.getAll();
  var bass = null;
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === 'bassspark') bass = all[i];
  }

  assert.ok(bass);
  assert.strictEqual(bass.instrument, 'bass');
  assert.strictEqual(typeof bass.tabRenderers.songs, 'function');
  var html = bass.tabRenderers.songs();
  assert.ok(html.indexOf('Bass Performance Charts') >= 0);
  assert.ok(html.indexOf('Midnight Lock') >= 0);
});

// Summary
console.log('\n' + '='.repeat(40));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('='.repeat(40));
process.exit(failed > 0 ? 1 : 0);
