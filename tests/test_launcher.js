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
  assert.ok(showroomSource.indexOf(' : "act(\\\'showroomStartPerf\\\')"') >= 0 || showroomSource.indexOf(' : "act(\'showroomStartPerf\')"') >= 0);
  assert.ok(showroomSource.indexOf('var signInAction = opts.signInAction || "act(\\\'showroomOpenSignIn\\\')"') >= 0 || showroomSource.indexOf('var signInAction = opts.signInAction || "act(\'showroomOpenSignIn\')"') >= 0);
  assert.ok(showroomSource.indexOf("SparkInstruments.openLauncherView('calibration')") >= 0);
  assert.ok(showroomSource.indexOf('<button type="button" class="showroom-avatar" onclick="') >= 0);
  assert.ok(showroomSource.indexOf('<button type="button" class="showroom-syllabus-avatar" onclick="') >= 0);
  assert.ok(showroomSource.indexOf("act(\\'showroomStartPerf\\'" ) >= 0 || showroomSource.indexOf("act('showroomStartPerf'") >= 0);
  assert.ok(showroomSource.indexOf("sampleInstrumentMap") >= 0);
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
