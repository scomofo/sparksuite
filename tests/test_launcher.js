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
global.S = { completedLessons: [], mastery: { rhythm: {} } };

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
}

function installMinimalDocument() {
  global.document = {
    readyState: 'complete',
    body: { innerText: '' },
    addEventListener: function() {},
    querySelector: function() { return null; },
    querySelectorAll: function() { return []; },
    createElement: function() {
      return {
        style: {},
        setAttribute: function() {},
        addEventListener: function() {}
      };
    }
  };
  global.CustomEvent = function(name, options) { return { name: name, detail: options && options.detail }; };
  global.dispatchEvent = function() {};
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

test('register refreshes the inactive launcher when instruments arrive late', function() {
  var renderCalls = 0;
  global.S = { activeInstrument: null, launcherView: 'home' };
  global.render = function() { renderCalls++; };

  SparkInstruments.register({
    id: 'late_uke', instrument: 'ukulele', name: 'Late Uke', icon: 'U',
    available: true, getData: function() { return {}; },
    pages: {}, tabs: [], stemMutePreset: {}, init: function() {}
  });

  assert.strictEqual(renderCalls, 1);
});

test('register ignores duplicates', function() {
  var before = SparkInstruments.getAll().length;
  SparkInstruments.register({
    id: 'test_guitar', instrument: 'guitar', name: 'Guitar2', icon: 'G2',
    skin: null, available: true, getData: function() { return {}; },
    pages: {}, tabs: [], stemMutePreset: {}, init: function() {}
  });
  assert.strictEqual(SparkInstruments.getAll().length, before);
});

test('activate sets active instrument', function() {
  SparkInstruments.activate('test_guitar');
  var active = SparkInstruments.getActive();
  assert.ok(active);
  assert.strictEqual(active.id, 'test_guitar');
});

test('getPage rehydrates active instrument from saved state before resolving pages', function() {
  SparkInstruments.activate('test_piano');
  S.activeInstrument = 'test_guitar';
  var page = SparkInstruments.getPage('home');
  assert.ok(page);
  assert.strictEqual(page(), '<div>Guitar Home</div>');
  assert.strictEqual(SparkInstruments.getActive().id, 'test_guitar');
});

test('deactivate clears active instrument', function() {
  S.screen = 'session';
  S.tab = 'songs';
  S.launcherView = 'profile';
  SparkInstruments.deactivate();
  assert.strictEqual(SparkInstruments.getActive(), null);
  assert.strictEqual(S.screen, 'home');
  assert.strictEqual(S.tab, 'practice');
  assert.strictEqual(S.launcherView, null);
});

test('launcher view switches clear stale showroom overrides', function() {
  S.activeInstrument = 'test_guitar';
  S._showroomOverride = 'library';
  S.launcherView = 'song-details';
  SparkInstruments.activate('test_guitar');

  SparkInstruments.openLauncherView('settings');
  assert.strictEqual(S.activeInstrument, null);
  assert.strictEqual(SparkInstruments.getActive(), null);
  assert.strictEqual(S._showroomOverride, null);
  assert.strictEqual(S.launcherView, 'settings');

  SparkInstruments.activate('test_piano');
  S._showroomOverride = 'profile';
  SparkInstruments.showLauncher();
  assert.strictEqual(SparkInstruments.getActive(), null);
  assert.strictEqual(S._showroomOverride, null);
  assert.strictEqual(S.launcherView, 'home');
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

test('launcher home kicks deferred instrument registration loading', function() {
  var loadCalls = 0;
  global.S = { activeInstrument: null, launcherView: 'home' };
  global.SparkBootLoader = {
    hasDeferredScripts: function() { return true; },
    hasFailures: function() { return false; },
    loadDeferredScripts: function(callback) {
      loadCalls++;
      if (typeof callback === 'function') callback();
    }
  };
  global.render = function() {};

  SparkInstruments.renderLauncher();

  assert.strictEqual(loadCalls, 1);
  global.SparkBootLoader = {
    hasDeferredScripts: function() { return false; },
    hasFailures: function() { return false; }
  };
});

test('renderLauncher wires hero and launcher utility actions', function() {
  var html = SparkInstruments.renderLauncher();
  assert.ok(html.indexOf("act('launcherLaunchPerformance','test_guitar')") >= 0);
  assert.ok(html.indexOf("act('openLauncherView','profile')") >= 0);
  assert.ok(html.indexOf("act('openLauncherView','instruments')") >= 0);
  assert.ok(html.indexOf("onkeydown=\"if(event.key==='Enter'||event.key===' '){event.preventDefault();act('launcherSelectInstrument','test_guitar')}\"") >= 0);
});

test('piano songs build helper stays namespaced so shared build tab is not shadowed', function() {
  var source = loadJS('js/instruments/piano/pages/songs.js');
  assert.ok(source.indexOf('case "build":   html += pianoBuildTab(); break;') >= 0);
  assert.ok(source.indexOf('function pianoBuildTab() {') >= 0);
  assert.strictEqual(source.indexOf('function buildTab() {'), -1);
});

test('piano bootstrap preserves existing pages while adding deferred registrations', function() {
  SparkInstruments.register({
    id: 'pianospark', instrument: 'piano', name: 'PianoSpark', icon: 'P',
    skin: SparkHighway.PIANO_SKIN, available: true,
    getData: function() { return {}; },
    pages: { legacy: function() { return '<div>Legacy Piano Page</div>'; } },
    tabs: ['practice'], stemMutePreset: {}, init: function() {}
  });
  global.SCR = {
    SESSION: 'session',
    PERFORM: 'perform',
    PERFORM_DONE: 'perform_done',
    PERFORM_SONG: 'perform_song',
    PLAN: 'plan',
    INSIGHTS: 'insights',
    PERF_EDITOR: 'perf_editor',
    ONBOARDING: 'onboarding',
    STEMS: 'stems'
  };
  global.pianoSessionPage = function() { return '<div>Session</div>'; };
  eval(loadJS('js/piano-registration-bootstrap.js'));

  var all = SparkInstruments.getAll();
  var piano = null;
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === 'pianospark') piano = all[i];
  }

  assert.ok(piano);
  assert.strictEqual(typeof piano.pages.legacy, 'function');
  assert.strictEqual(typeof piano.pages.session, 'function');
});

test('renderLauncher respects launcherView showroom routes', function() {
  global.SparkProfileScreen = { render: function() { return '<div>Profile View</div>'; } };
  global.SparkSongLibrary = { render: function() { return '<div>Library View</div>'; } };
  global.SparkSongDetails = { render: function() { return '<div>Song Details View</div>'; } };
  global.SparkTuner = { render: function() { return '<div>Tuner View</div>'; } };
  global.SparkPracticeMetro = { render: function() { return '<div>Practice Metro View</div>'; } };
  global.SparkSessionSummary = { render: function() { return '<div>Session Summary View</div>'; } };
  global.SparkPerformance = { render: function() { return '<div>Performance View</div>'; } };
  global.SparkLesson = { render: function() { return '<div>Lesson View</div>'; } };
  global.SparkPath = { render: function() { return '<div>Learn View</div>'; } };
  global.insightsDashboardPage = function() { return '<div>Insights View</div>'; };
  global.performCalibrationPage = function() { return '<div>Calibration View</div>'; };
  global.SparkCurriculumDashboard = { render: function() { return '<div>Curriculum View</div>'; } };
  global.SparkCourseSyllabus = { render: function() { return '<div>Syllabus View</div>'; } };
  global.SparkOnboardingWelcome = { render: function() { return '<div>Onboarding View</div>'; } };
  global.SparkSettings = { render: function() { return '<div>Settings View</div>'; } };

  S.launcherView = 'library';
  assert.ok(SparkInstruments.renderLauncher().indexOf('Library View') >= 0);

  S.launcherView = 'practice';
  assert.ok(SparkInstruments.renderLauncher().indexOf('Practice Metro View') >= 0);

  S.launcherView = 'song-details';
  assert.ok(SparkInstruments.renderLauncher().indexOf('Song Details View') >= 0);

  S.launcherView = 'learn';
  assert.ok(SparkInstruments.renderLauncher().indexOf('Learn View') >= 0);

  S.launcherView = 'path';
  assert.ok(SparkInstruments.renderLauncher().indexOf('Learn View') >= 0);

  S.launcherView = 'settings';
  assert.ok(SparkInstruments.renderLauncher().indexOf('Settings View') >= 0);

  S.launcherView = 'profile';
  assert.ok(SparkInstruments.renderLauncher().indexOf('Profile View') >= 0);

  S.launcherView = 'tuner';
  assert.ok(SparkInstruments.renderLauncher().indexOf('Tuner View') >= 0);

  S.launcherView = 'practice-metro';
  assert.ok(SparkInstruments.renderLauncher().indexOf('Practice Metro View') >= 0);

  S.launcherView = 'session-summary';
  assert.ok(SparkInstruments.renderLauncher().indexOf('Session Summary View') >= 0);

  S.launcherView = 'performance';
  assert.ok(SparkInstruments.renderLauncher().indexOf('Performance View') >= 0);

  S.launcherView = 'lesson';
  assert.ok(SparkInstruments.renderLauncher().indexOf('Lesson View') >= 0);

  S.launcherView = 'calibration';
  assert.ok(SparkInstruments.renderLauncher().indexOf('Calibration View') >= 0);

  S.launcherView = 'insights';
  assert.ok(SparkInstruments.renderLauncher().indexOf('Insights View') >= 0);

  S.launcherView = 'curriculum';
  assert.ok(SparkInstruments.renderLauncher().indexOf('Curriculum View') >= 0);

  S.launcherView = 'syllabus';
  assert.ok(SparkInstruments.renderLauncher().indexOf('Syllabus View') >= 0);

  S.launcherView = 'onboarding';
  assert.ok(SparkInstruments.renderLauncher().indexOf('Onboarding View') >= 0);

  S.launcherView = 'instruments';
  assert.ok(SparkInstruments.renderLauncher().indexOf('All Instruments') >= 0);

  S.launcherView = 'back';
  assert.ok(SparkInstruments.renderLauncher().indexOf('SparkSuite') >= 0);

  S.launcherView = 'home';
});

test('render_showroom routes settings overrides to SparkSettings', function() {
  var previousDocument = global.document;
  var previousWrite = global._writeAppHtml;
  var previousSettings = global.SparkSettings;
  var previousS = global.S;
  var previousSCR = global.SCR;
  var header = { style: {} };
  var written = "";

  global.document = {
    getElementById: function(id) {
      return id === "header" ? header : null;
    }
  };
  global._writeAppHtml = function(html) {
    written = html;
  };
  global.SparkSettings = { render: function() { return "<div>Settings Override</div>"; } };
  global.S = { _showroomOverride: "settings" };
  global.SCR = { COMPLETE: "complete" };

  eval(loadJS("js/render_showroom.js"));

  assert.strictEqual(_renderShowroomOverride(), true);
  assert.strictEqual(header.style.display, "none");
  assert.ok(written.indexOf("Settings Override") >= 0);

  global.document = previousDocument;
  global._writeAppHtml = previousWrite;
  global.SparkSettings = previousSettings;
  global.S = previousS;
  global.SCR = previousSCR;
});

test('render_showroom routes performance overrides to SparkPerformance', function() {
  var previousDocument = global.document;
  var previousWrite = global._writeAppHtml;
  var previousPerformance = global.SparkPerformance;
  var previousS = global.S;
  var previousSCR = global.SCR;
  var header = { style: {} };
  var written = "";

  global.document = {
    getElementById: function(id) {
      return id === "header" ? header : null;
    }
  };
  global._writeAppHtml = function(html) {
    written = html;
  };
  global.SparkPerformance = { render: function() { return "<div>Performance Override</div>"; } };
  global.S = { _showroomOverride: "performance" };
  global.SCR = { COMPLETE: "complete" };

  eval(loadJS("js/render_showroom.js"));

  assert.strictEqual(_renderShowroomOverride(), true);
  assert.strictEqual(header.style.display, "none");
  assert.ok(written.indexOf("Performance Override") >= 0);

  global.document = previousDocument;
  global._writeAppHtml = previousWrite;
  global.SparkPerformance = previousPerformance;
  global.S = previousS;
  global.SCR = previousSCR;
});

test('ukulele register adds a selectable launcher instrument', function() {
  eval(loadJS('js/ui/stringed_chord_svg.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_skill_tree.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_lessons.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_chords.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_scales.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_tuning.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_exercises.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_progression.js'));
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_module.js'));
  eval(loadJS('js/instruments/ukulele/chord_normalizer.js'));
  eval(loadJS('js/instruments/ukulele/validator.js'));
  eval(loadJS('js/instruments/ukulele/ukulele_svg.js'));
  eval(loadJS('js/instruments/ukulele/register.js'));

  var all = SparkInstruments.getAll();
  var ukulele = null;
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === 'ukespark') ukulele = all[i];
  }

  assert.ok(ukulele);
  assert.strictEqual(ukulele.instrument, 'ukulele');
  assert.strictEqual(typeof ukulele.tabRenderers.practice, 'function');
  var practiceHtml = ukulele.tabRenderers.practice();
  assert.ok(practiceHtml.indexOf("Quick Win 10") >= 0);
  assert.ok(practiceHtml.indexOf("Low Energy 10") >= 0);
  assert.ok(practiceHtml.indexOf("Reset Focus 10") >= 0);
  assert.ok(practiceHtml.indexOf("Uke Set A") >= 0);
  assert.ok(practiceHtml.indexOf("openUkuleleMiniSession") >= 0);
});

test('showroom svg provides a microphone silhouette for VocalSpark', function() {
  eval(loadJS('js/showroom/spark-showroom-svgs.js'));
  var cardSvg = SparkShowroomSVG.card('vocals');
  var heroSvg = SparkShowroomSVG.hero('vocals');

  assert.ok(cardSvg.indexOf('rx="12"') >= 0);
  assert.ok(cardSvg.indexOf('M32 48 C32 62 40 72 50 72') >= 0);
  assert.ok(cardSvg.indexOf('#F472B6') >= 0);
  assert.ok(heroSvg.indexOf('rx="12"') >= 0);
});

test('vocals register adds a selectable launcher instrument', function() {
  installMinimalDocument();
  eval(loadJS('js/sparksuite/instruments/vocals/vocals_skill_tree.js'));
  eval(loadJS('js/sparksuite/instruments/vocals/vocals_curriculum.js'));
  eval(loadJS('js/sparksuite/instruments/vocals/vocals_lessons.js'));
  eval(loadJS('js/sparksuite/instruments/vocals/vocals_exercises.js'));
  eval(loadJS('js/sparksuite/instruments/vocals/vocals_module.js'));
  eval(loadJS('js/instruments/vocals/register.js'));

  var all = SparkInstruments.getAll();
  var vocals = null;
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === 'vocalspark') vocals = all[i];
  }

  assert.ok(vocals);
  assert.strictEqual(vocals.instrument, 'vocals');
  assert.strictEqual(vocals.iconImage, 'resources/instruments/vocals/card.png');
  assert.strictEqual(vocals.heroImage, 'resources/instruments/vocals/hero.jpg');
  assert.strictEqual(typeof vocals.tabRenderers.practice, 'function');
});

test('vocals register upserts existing app-id catalog entries', function() {
  installMinimalDocument();
  global.SPARK_INSTRUMENTS = [{ id: 'vocalspark', instrument: 'vocals', name: 'Existing VocalSpark' }];
  eval(loadJS('js/instruments/vocals/register.js'));

  assert.strictEqual(SPARK_INSTRUMENTS.length, 1);
  assert.strictEqual(SPARK_INSTRUMENTS[0].id, 'vocalspark');
  assert.strictEqual(SPARK_INSTRUMENTS[0].instrumentId, 'vocals');
});

test('vocals register upserts existing instrument-type catalog entries', function() {
  installMinimalDocument();
  global.SPARK_INSTRUMENTS = [{ id: 'legacy_voice_entry', instrument: 'vocals', name: 'Existing Vocals' }];
  eval(loadJS('js/instruments/vocals/register.js'));

  assert.strictEqual(SPARK_INSTRUMENTS.length, 1);
  assert.strictEqual(SPARK_INSTRUMENTS[0].id, 'vocalspark');
  assert.strictEqual(SPARK_INSTRUMENTS[0].instrument, 'vocals');
});

test('vocals register writes Map-style registries with a stable key', function() {
  installMinimalDocument();
  global.SparkInstrumentRegistry = new Map();
  eval(loadJS('js/instruments/vocals/register.js'));

  assert.strictEqual(SparkInstrumentRegistry.size, 1);
  assert.ok(SparkInstrumentRegistry.has('vocals'));
  assert.strictEqual(SparkInstrumentRegistry.get('vocals').id, 'vocalspark');
});

test('vocals lesson start opens the practice plan screen', function() {
  var planCalls = [];
  installMinimalDocument();
  global.S = { completedLessons: [], mastery: { rhythm: {} }, screen: 'home' };
  global.openPracticePlanScreenRequest = function(payload) {
    planCalls.push(payload || {});
    return payload || {};
  };
  global.SCR = { PLAN: 'plan' };
  global.render = function() {};
  eval(loadJS('js/sparksuite/instruments/vocals/vocals_skill_tree.js'));
  eval(loadJS('js/sparksuite/instruments/vocals/vocals_curriculum.js'));
  eval(loadJS('js/sparksuite/instruments/vocals/vocals_lessons.js'));
  eval(loadJS('js/sparksuite/instruments/vocals/vocals_exercises.js'));
  eval(loadJS('js/sparksuite/instruments/vocals/vocals_module.js'));
  eval(loadJS('js/instruments/vocals/register.js'));

  startVocalsLesson('lesson_vocal_setup_comfort_01');

  assert.strictEqual(S.screen, 'plan');
  assert.strictEqual(planCalls.length, 1);
  assert.strictEqual(planCalls[0].lessonId, 'lesson_vocal_setup_comfort_01');
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

test('shared guided completion preserves app ids for thin active instruments', function() {
  // The orchestrator-request helpers were extracted from js/app.js to
  // js/orchestrator-requests.js — the literal lines now live there.
  var orchestratorSource = loadJS('js/orchestrator-requests.js');
  assert.ok(orchestratorSource.indexOf('var guidedActiveInstrument = typeof SparkInstruments !== "undefined" && SparkInstruments.getActive ? SparkInstruments.getActive() : null;') >= 0);
  assert.ok(orchestratorSource.indexOf('instrumentId: guidedActiveInstrument ? (guidedActiveInstrument.id || guidedActiveInstrument.appId || null) : null,') >= 0);
});

test('onboarding intention input ignores stale sentinel strings', function() {
  // _renderOnboardingOverlay was extracted from js/app.js into js/render.js.
  var renderSource = loadJS('js/render.js');
  assert.ok(renderSource.indexOf('var onboardingPracticeIntention = normalizeAppTextInputValue(S.practiceIntention);') >= 0);
  assert.ok(renderSource.indexOf('value="\'+escHTML(onboardingPracticeIntention)+\'"') >= 0);
  assert.ok(renderSource.indexOf('onclick="act(\\\'appReload\\\')"') >= 0);
});

test('app boot resets to showroom home instead of restoring last active instrument', function() {
  var appSource = loadJS('js/app.js');
  assert.ok(appSource.indexOf('S.dailyChallenge=selectBootDailyChallenge();') >= 0);
  assert.ok(appSource.indexOf('console.error("ChordSpark: generatePracticePlan failed",e);') >= 0);
  assert.ok(appSource.indexOf('console.error("ChordSpark: choosePerformanceDailyChallenge failed",e);') >= 0);
  assert.ok(appSource.indexOf('S.activeInstrument=null;') >= 0);
  assert.ok(appSource.indexOf('S._showroomOverride=null;') >= 0);
  assert.ok(appSource.indexOf('S.launcherView="home";') >= 0);
});

test('boot loader tracks deferred failures instead of silently reporting ready', function() {
  var bootLoaderSource = loadJS('js/boot_loader.js');
  assert.ok(bootLoaderSource.indexOf('placeholder.setAttribute("data-deferred-failed", "true");') >= 0);
  assert.ok(bootLoaderSource.indexOf('hasFailures: function() { return _failed.length > 0; }') >= 0);
  assert.ok(bootLoaderSource.indexOf('document.documentElement.setAttribute("data-spark-deferred-failed", "true");') >= 0);
  assert.ok(bootLoaderSource.indexOf('if (_failed.length) return;') >= 0);
});

test('index loads boot loader before deferred instrument placeholders', function() {
  var source = loadJS('index.html');
  var bootIndex = source.indexOf('js/boot_loader.js');
  var deferredIndex = source.indexOf('data-deferred-src="js/instruments/bass/data.js"');
  assert.ok(bootIndex >= 0);
  assert.ok(deferredIndex >= 0);
  assert.ok(bootIndex < deferredIndex);
});

test('boot loader schedules deferred scripts after the page has parsed', function() {
  var bootLoaderSource = loadJS('js/boot_loader.js');
  assert.ok(bootLoaderSource.indexOf('document.addEventListener("DOMContentLoaded", scheduleDeferredScripts') >= 0);
  assert.ok(bootLoaderSource.indexOf('scheduleDeferredScripts();') >= 0);
});

test('showroom source wires remaining library, tuner, and syllabus controls', function() {
  var showroomSource = loadJS('js/showroom/spark-showroom.js');
  var systemFamilySource = loadJS('js/actions/system_family.js');
  var performanceFamilySource = loadJS('js/actions/performance_family.js');
  var launcherSource = loadJS('js/launcher.js');
  var showroomRenderSource = loadJS('js/render_showroom.js');
  assert.ok(showroomSource.indexOf('onclick="act(\\\'showroomFocusLibrarySearch\\\')"') >= 0);
  assert.ok(showroomSource.indexOf('id="showroom-library-search"') >= 0);
  assert.ok(showroomSource.indexOf('oninput="act(\\\'communitySearch\\\',this.value)"') >= 0);
  assert.ok(showroomSource.indexOf('var keyboard = row.onClick ?') >= 0);
  assert.ok(showroomSource.indexOf('role="button" tabindex="0" onkeydown="if(event.key===\\\'Enter\\\'||event.key===\\\' \\') >= 0);
  assert.ok(showroomSource.indexOf('class="showroom-song-row ') >= 0);
  assert.ok(showroomSource.indexOf('" role="button" tabindex="0" onclick="if(event.target&&event.target.closest&&event.target.closest(\\\'button,input,select,textarea,a\\\')){return;}') >= 0);
  assert.ok(showroomSource.indexOf("onkeydown=\"if(event.key===\\'Enter\\'||event.key===\\' \\'){event.preventDefault();") >= 0);
  assert.ok(showroomSource.indexOf('Quick Drills</h3><span class="link"') >= 0);
  assert.ok(showroomSource.indexOf('onkeydown="if(event.key===\\\'Enter\\\'||event.key===\\\' \\') >= 0);
  assert.ok(showroomSource.indexOf("act('showroomPlayLibrarySong'") >= 0 || showroomSource.indexOf('act(\\\'showroomPlayLibrarySong\\\'') >= 0);
  assert.strictEqual(showroomSource.indexOf("event.stopPropagation();act('showroomPlayLibrarySong'"), -1);
  assert.strictEqual(showroomSource.indexOf("event.stopPropagation();act('openPerformSong'"), -1);
  assert.ok(showroomSource.indexOf('onclick="act(\\\'showroomOpenQuickTools\\\')"') >= 0);
  assert.ok(showroomSource.indexOf('onclick="act(\\\'showroomToggleRecorder\\\')"') >= 0);
  assert.ok(showroomSource.indexOf('onclick="act(\\\'showroomToneGenerator\\\')"') >= 0);
  assert.ok(showroomSource.indexOf('act(\\\'showroomOpenTrendingScores\\\')') >= 0);
  assert.ok(showroomSource.indexOf('Continue Learning</h3><span class="link"') >= 0);
  assert.ok(showroomSource.indexOf('nav("curriculum")') >= 0);
  assert.ok(showroomSource.indexOf('nav("leaderboard")') >= 0);
  assert.ok(showroomSource.indexOf('nav("tools")') >= 0);
  assert.ok(showroomSource.indexOf('nav("insights")') >= 0);
  assert.ok(showroomSource.indexOf('label:"Practice",    icon:"music_note", onClick: nav("practice")') >= 0);
  assert.ok(showroomSource.indexOf('label:"Practice", icon:"music_note", onClick: nav("practice")') >= 0);
  assert.ok(showroomSource.indexOf('label:"Instruments", icon:"piano",       onClick: nav("instruments")') >= 0);
  assert.ok(showroomSource.indexOf('"instruments":     function(){ SparkInstruments.deactivate(); S.activeInstrument = null; S._showroomOverride = null; S.launcherView = "instruments"; }') >= 0);
assert.ok(showroomSource.indexOf('"curriculum":      function(){ S._showroomOverride = "curriculum"; }') >= 0);
assert.ok(showroomSource.indexOf('"syllabus":        function(){ S._showroomOverride = "syllabus"; }') >= 0);
assert.ok(showroomSource.indexOf("return \"act('showroomStartPerf')\";") >= 0 || showroomSource.indexOf("act('showroomStartPerf')") >= 0);
assert.ok(showroomSource.indexOf('function getShowroomLessonCtaAction(lesson)') >= 0);
assert.ok(showroomSource.indexOf("act('resume_guided_session')") >= 0);
assert.ok(showroomSource.indexOf("Resume Practice") >= 0);
assert.ok(showroomSource.indexOf('var signInAction = opts.signInAction || "act(\\\'showroomOpenSignIn\\\')"') >= 0 || showroomSource.indexOf('var signInAction = opts.signInAction || "act(\'showroomOpenSignIn\')"') >= 0);
  assert.ok(showroomSource.indexOf("SparkInstruments.openLauncherView('calibration')") >= 0);
  assert.ok(showroomSource.indexOf('<button type="button" class="showroom-avatar" onclick="') >= 0);
  assert.ok(showroomSource.indexOf('<button type="button" class="showroom-syllabus-avatar" onclick="') >= 0);
  assert.ok(showroomSource.indexOf("act(\\'showroomStartPerf\\'" ) >= 0 || showroomSource.indexOf("act('showroomStartPerf'") >= 0);
  assert.ok(showroomSource.indexOf("function showroomInstrumentDisplayName(type)") >= 0);
  assert.ok(showroomSource.indexOf('window.SparkLeaderboard') >= 0);
  assert.ok(showroomSource.indexOf('opts.ctaAction || nav("lesson")') >= 0);
  assert.ok(systemFamilySource.indexOf('if (a === "showroomFocusLibrarySearch")') >= 0);
  assert.ok(systemFamilySource.indexOf('if (a === "showroomOpenTrendingScores")') >= 0);
  assert.ok(systemFamilySource.indexOf('if (a === "showroomToggleRecorder")') >= 0);
  assert.ok(systemFamilySource.indexOf('if (a === "showroomToneGenerator")') >= 0);
  assert.ok(systemFamilySource.indexOf('if (a === "showroomOpenSignIn")') >= 0);
  assert.ok(performanceFamilySource.indexOf('if (a === "showroomPlayLibrarySong")') >= 0);
  assert.ok(performanceFamilySource.indexOf('resolveShowroomPerformanceAppId') >= 0);
  assert.ok(performanceFamilySource.indexOf('ensureShowroomPerformanceInstrument("guitar");') >= 0);
  assert.ok(performanceFamilySource.indexOf('SparkInstruments.launchInstrumentPerformance(appId)') >= 0);
  assert.ok(performanceFamilySource.indexOf('return handlePerformanceAction("showroomStartPerf");') >= 0);
  assert.ok(launcherSource.indexOf('leaderboard: typeof SparkLeaderboard') >= 0);
  assert.ok(launcherSource.indexOf('insights: typeof insightsDashboardPage') >= 0);
  assert.ok(launcherSource.indexOf('tools: typeof SparkTuner') >= 0);
  assert.ok(launcherSource.indexOf('calibration: typeof performCalibrationPage === "function"') >= 0);
  assert.ok(launcherSource.indexOf('instruments: typeof renderInstrumentsView === "function" ? renderInstrumentsView : null') >= 0);
  assert.ok(launcherSource.indexOf('S._showroomOverride = null;') >= 0);
  assert.ok(launcherSource.indexOf('_active = null;') >= 0);
  assert.ok(showroomRenderSource.indexOf('"curriculum":      typeof SparkCurriculumDashboard') >= 0);
  assert.ok(showroomRenderSource.indexOf('"syllabus":        typeof SparkCourseSyllabus') >= 0);
  assert.ok(showroomRenderSource.indexOf('"leaderboard":     typeof SparkLeaderboard') >= 0);
  assert.ok(showroomRenderSource.indexOf('"tools":           typeof SparkTuner') >= 0);
});

test('launcher deferred asset guard does not synchronously recurse when already ready', function() {
  global.S = { activeInstrument: null, launcherView: 'song-details', _showroomOverride: 'song-details' };
  global.SparkBootLoader = {
    hasDeferredScripts: function() { return false; },
    hasFailures: function() { return false; }
  };
  var saveCalls = 0;
  var renderCalls = 0;
  global.saveState = function() { saveCalls++; };
  global.render = function() { renderCalls++; };
  global.SCR = { HOME: 'home' };
  global.TAB = { PRACTICE: 'practice', SONGS: 'songs' };
  global.openPerformanceSongSelectionRequest = function() {};

  SparkInstruments.selectInstrument('test_guitar');
  assert.strictEqual(S.activeInstrument, 'test_guitar');
  assert.strictEqual(S.launcherView, null);
  assert.strictEqual(S._showroomOverride, null);
  assert.strictEqual(saveCalls, 1);
  assert.strictEqual(renderCalls, 1);

  S.launcherView = 'session-summary';
  S._showroomOverride = 'session-summary';
  SparkInstruments.launchInstrumentPerformance('test_guitar');
  assert.strictEqual(S.activeInstrument, 'test_guitar');
  assert.strictEqual(S.launcherView, null);
  assert.strictEqual(S._showroomOverride, null);
  assert.strictEqual(S.tab, 'songs');
  assert.strictEqual(saveCalls, 2);
  assert.strictEqual(renderCalls, 2);
});

test('shell action family routes launcher interactions through SparkInstruments', function() {
  var handled;
  var calls = [];
  global.runSparkActionFamilies = undefined;
  global.registerSparkActionFamily = function(name, handler) {
    global.runSparkActionFamilies = handler;
  };
  global.SparkInstruments = {
    openLauncherView: function(view) { calls.push(["openLauncherView", view]); },
    showLauncher: function() { calls.push(["showLauncher"]); },
    selectInstrument: function(appId) { calls.push(["selectInstrument", appId]); },
    launchInstrumentPerformance: function(appId) { calls.push(["launchInstrumentPerformance", appId]); }
  };
  global.eval(loadJS("js/actions/shell_family.js"));

  handled = global.runSparkActionFamilies("openLauncherView", "library");
  assert.strictEqual(handled, true);
  handled = global.runSparkActionFamilies("showLauncher");
  assert.strictEqual(handled, true);
  handled = global.runSparkActionFamilies("launcherSelectInstrument", "test_guitar");
  assert.strictEqual(handled, true);
  handled = global.runSparkActionFamilies("launcherLaunchPerformance", "test_piano");
  assert.strictEqual(handled, true);
  assert.deepStrictEqual(calls, [
    ["openLauncherView", "library"],
    ["showLauncher"],
    ["selectInstrument", "test_guitar"],
    ["launchInstrumentPerformance", "test_piano"]
  ]);
});

// Summary
console.log('\n' + '='.repeat(40));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('='.repeat(40));
process.exit(failed > 0 ? 1 : 0);
