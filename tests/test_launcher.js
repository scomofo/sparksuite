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
  read: function(path, fallback) {
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = global.S;
    var i;
    for (i = 0; i < parts.length; i++) {
      if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  },
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

function listJsFiles(dir) {
  return fs.readdirSync(dir).reduce(function(files, entry) {
    var fullPath = path.join(dir, entry);
    var stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      return files.concat(listJsFiles(fullPath));
    }
    if (/\.js$/i.test(entry)) {
      files.push(fullPath);
    }
    return files;
  }, []);
}

eval(loadJS('js/launcher.js'));
eval(loadJS('js/instruments/ukulele/chord_normalizer.js'));
eval(loadJS('js/instruments/ukulele/validator.js'));

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

test('shared app launcher actions keep local state fallbacks when launcher bridge helpers are unavailable', function() {
  var appSource = loadJS('js/app.js');
  assert.ok(/if\(a==="returnToLauncher"\)\{\s*if \(typeof window\.returnToLauncherFromHeader === "function"\) \{\s*window\.returnToLauncherFromHeader\(\);\s*\} else \{[\s\S]*?appWrite\("activeInstrument", null\);[\s\S]*?appWrite\("screen", SCR\.HOME\);[\s\S]*?appWrite\("tab", TAB\.PRACTICE\);[\s\S]*?saveState\(\);[\s\S]*?render\(\);[\s\S]*?\}\s*return;\s*\}/.test(appSource));
  assert.ok(/if\(a==="openInstrument" && v\)\{\s*if \(typeof window\.openInstrumentFromLauncher === "function"\) \{\s*window\.openInstrumentFromLauncher\(v\);\s*\} else \{[\s\S]*?appWrite\("activeInstrument", v\);[\s\S]*?appWrite\("screen", SCR\.HOME\);[\s\S]*?appWrite\("tab", TAB\.PRACTICE\);[\s\S]*?saveState\(\);[\s\S]*?render\(\);[\s\S]*?\}\s*return;\s*\}/.test(appSource));
});

test('app startup normalizes legacy active instrument aliases before activation', function() {
  var appSource = loadJS('js/app.js');
  assert.ok(appSource.indexOf('guitar: "chordspark"') >= 0);
  assert.ok(appSource.indexOf('var persistedActiveInstrument=normalizeActiveInstrumentId(appRead("activeInstrument", null));') >= 0);
});

test('shared app routes chart and exercise editor actions through the editor engine', function() {
  var appSource = loadJS('js/app.js');
  var dataSource = loadJS('js/data.js');
  assert.ok(dataSource.indexOf('EDITOR:"editor"') >= 0);
  assert.ok(appSource.indexOf('if(a==="openChartEditor"){') >= 0);
  assert.ok(appSource.indexOf('openEditor("chart")') >= 0);
  assert.ok(appSource.indexOf('if(a==="openExerciseEditor"){') >= 0);
  assert.ok(appSource.indexOf('openEditor("exercise")') >= 0);
  assert.ok(appSource.indexOf('if(a==="editorClose"){') >= 0);
  assert.ok(appSource.indexOf('_sharedPages[SCR.EDITOR] = typeof editorPage === "function" ? editorPage : null;') >= 0);
});

test('shared app routes editor toolbar actions through the shared editor engine', function() {
  var appSource = loadJS('js/app.js');
  assert.ok(appSource.indexOf('if(appRead("screen", null)===SCR.EDITOR){') >= 0);
  assert.ok(appSource.indexOf('if(a==="editorField"){') >= 0);
  assert.ok(appSource.indexOf('if(a==="editorItemField"){') >= 0);
  assert.ok(appSource.indexOf('if(a==="editorAddAtPlayhead"){') >= 0);
  assert.ok(appSource.indexOf('if(a==="editorDeleteSelected"){') >= 0);
  assert.ok(appSource.indexOf('if(a==="editorPreview"){') >= 0);
  assert.ok(appSource.indexOf('showToast("Add at least one chart event before previewing.")') >= 0);
  assert.ok(appSource.indexOf('showToast("Add some chart events before exporting.")') >= 0);
  assert.ok(appSource.indexOf('saveEditorObjectToLibrary') >= 0);
  assert.ok(appSource.indexOf('exportEditorObjectDesktopAware') >= 0);
});

test('index loads the shared execution gateway for editor preview flows', function() {
  var indexHtml = loadJS('index.html');
  assert.ok(indexHtml.indexOf('js/sparksuite/core/execution_gateway.js') >= 0);
});

test('analytics recommendation buttons route through shared and piano dispatchers', function() {
  var appSource = loadJS('js/app.js');
  var pianoSource = loadJS('js/instruments/piano/app.js');
  assert.ok(appSource.indexOf('if(a==="launchAnalyticsRecommendation"){') >= 0);
  assert.ok(appSource.indexOf('showToast("Recommendations aren\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('launchPracticeItem(analyticsItems[analyticsIndex])') >= 0);
  assert.ok(appSource.indexOf("That practice item couldn't be started right now.") >= 0);
  assert.ok(pianoSource.indexOf('case "launchAnalyticsRecommendation":') >= 0);
  assert.ok(pianoSource.indexOf('launchPracticeItem(pianoAnalyticsItems[pianoAnalyticsIndex])') >= 0);
  assert.ok(pianoSource.indexOf("That practice item couldn't be started right now.") >= 0);
});

test('feedback draft input routes through the shared dispatcher', function() {
  var appSource = loadJS('js/app.js');
  var feedbackSource = loadJS('js/desktop/feedback.js');
  assert.ok(/feedbackDraftText\\',this\.value/.test(feedbackSource));
  assert.ok(appSource.indexOf('if(a==="feedbackDraftText"){') >= 0);
});

test('feedback export falls back to browser download and surfaces status', function() {
  var feedbackSource = loadJS('js/desktop/feedback.js');
  assert.ok(feedbackSource.indexOf('a.download = "sparksuite-feedback.json";') >= 0);
  assert.ok(feedbackSource.indexOf('setFeedbackExportMsg(true, "Feedback downloaded.");') >= 0);
  assert.ok(feedbackSource.indexOf('feedbackExportMsg') >= 0);
});

test('check updates surfaces a browser fallback message', function() {
  var appSource = loadJS('js/app.js');
  assert.ok(appSource.indexOf('showToast("App updates are only available in the desktop build.")') >= 0);
  assert.ok(appSource.indexOf('showToast("Backup export isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('showToast("Feedback export isn\'t available right now.")') >= 0);
});

test('full backup export also falls back to browser download outside desktop builds', function() {
  var bridgeSource = loadJS('js/desktop/bridge.js');
  assert.ok(bridgeSource.indexOf('a.download = "sparksuite-backup.json";') >= 0);
  assert.ok(bridgeSource.indexOf('desktopBridgeWrite(["desktopInfo", "lastBackupAt"], Date.now());') >= 0);
});

test('midi import falls back to the internal parser and surfaces import errors', function() {
  var chartIoSource = loadJS('js/sparksuite/core/chart_io.js');
  var midiParseSource = loadJS('js/import/midi_parse.js');
  var midiUiSource = loadJS('js/import/midi_ui.js');
  var appSource = loadJS('js/app.js');
  var pianoSource = loadJS('js/instruments/piano/app.js');
  assert.ok(chartIoSource.indexOf('window.SparkChartIO.parseMidiBuffer = parseMidiBuffer;') >= 0);
  assert.ok(midiParseSource.indexOf('typeof SparkChartIO !== "undefined" && typeof SparkChartIO.parseMidiBuffer === "function"') >= 0);
  assert.ok(midiUiSource.indexOf('midiImportWrite("midiImportError"') >= 0);
  assert.ok(midiUiSource.indexOf('<b>Import error:</b>') >= 0);
  assert.ok(appSource.indexOf('showToast("MIDI import isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('showToast("MIDI track assignment isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('showToast("No usable seed chart could be built from that MIDI import.")') >= 0);
  assert.ok(appSource.indexOf('showToast("MIDI seed chart building isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('openEditor("chart",chart);render();') >= 0);
  assert.ok(pianoSource.indexOf('openEditor("chart", seedChart);') >= 0);
});

test('midi seed builder falls back to single imported tracks instead of opening empty charts', function() {
  global.createSparkChart = function() { return { events: [], phrases: [] }; };
  global.generateId = function(prefix) { return prefix + '_test'; };
  eval(loadJS('js/import/midi_seed.js'));

  var chart = buildSeedChartFromImportedMidi({
    sourceName: 'stand_by_me.mid',
    tempoMap: [{ bpm: 120 }],
    tracks: [{
      id: 'track_1',
      notes: [
        { startSec: 0, durSec: 0.5, note: 'E4', pitch: 64, velocity: 0.8 },
        { startSec: 1, durSec: 0.5, note: 'G4', pitch: 67, velocity: 0.8 }
      ]
    }]
  }, { track_1: 'chord_seed' }, 'guitar_single_note');

  assert.ok(chart);
  assert.strictEqual(chart.events.length, 2);
});

test('cloud actions surface login and sync errors instead of failing silently', function() {
  var appSource = loadJS('js/app.js');
  var pianoSource = loadJS('js/instruments/piano/app.js');
  var cloudUiSource = loadJS('js/cloud/ui.js');
  var cloudSyncSource = loadJS('js/cloud/sync.js');
  assert.ok(appSource.indexOf('appWrite("cloudLastError",loginError);') >= 0);
  assert.ok(appSource.indexOf('syncUnavailableError="Cloud sync is unavailable right now.";') >= 0);
  assert.ok(appSource.indexOf('pullUnavailableError="Cloud pull is unavailable right now.";') >= 0);
  assert.ok(appSource.indexOf('showToast("Enter both email and password to log in.")') >= 0);
  assert.ok(appSource.indexOf('appWrite("cloudEmailDraft", String(v == null ? "" : v));') >= 0);
  assert.ok(appSource.indexOf('appWrite("cloudPasswordDraft", String(v == null ? "" : v));') >= 0);
  assert.ok(appSource.indexOf('showToast("Cloud logout is unavailable right now.")') >= 0);
  assert.ok(appSource.indexOf('applyCloudWorkflowRequest("login_error",{lastSyncStatus:"error",lastError:loginError});') >= 0);
  assert.ok(appSource.indexOf('prompt("Email:")') === -1);
  assert.ok(pianoSource.indexOf('state.cloudLastError = clError;') >= 0);
  assert.ok(pianoSource.indexOf('prompt("Email:")') === -1);
  assert.ok(cloudUiSource.indexOf('act(\\\'cloudEmailDraft\\\', this.value)') >= 0);
  assert.ok(cloudUiSource.indexOf('act(\\\'cloudPasswordDraft\\\', this.value)') >= 0);
  assert.ok(cloudUiSource.indexOf('<b>Error:</b>') >= 0);
  assert.ok(cloudSyncSource.indexOf('cloudSyncWrite("cloudLastError", String((e && e.message) || e || "Cloud sync failed."));') >= 0);
  assert.ok(cloudSyncSource.indexOf('cloudSyncWrite("cloudLastError", String((e && e.message) || e || "Cloud pull failed."));') >= 0);
});

test('midi profile actions surface feedback when profile helpers are unavailable', function() {
  var appSource = loadJS('js/app.js');
  assert.ok(appSource.indexOf('showToast("MIDI profiles aren\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('showToast("Piano MIDI profiles aren\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('showToast("Guitar MIDI profiles aren\'t available right now.")') >= 0);
});

test('play-along and onboarding actions surface feedback when helpers are unavailable', function() {
  var appSource = loadJS('js/app.js');
  assert.ok(appSource.indexOf('function dispatchPlayAlongAction(name, arg1, arg2) {') >= 0);
  assert.ok(appSource.indexOf('if (callPlayAlongHandler(name, arg1, arg2) !== null) return true;') >= 0);
  assert.ok(appSource.indexOf('if(a==="openPlayAlongHome"){') >= 0);
  assert.ok(appSource.indexOf('dispatchPlayAlongAction("openPlayAlong")') >= 0);
  assert.ok(appSource.indexOf('dispatchPlayAlongAction("sparkPlayAlongSelect", v)') >= 0);
  assert.ok(appSource.indexOf('dispatchPlayAlongAction("sparkPlayAlongReplay")') >= 0);
  assert.ok(appSource.indexOf('showToast("Play Along isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('showToast("Onboarding isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('showToast("Dashboard refresh isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('if(a==="onboardingSetInstrument"){') >= 0);
  assert.ok(appSource.indexOf('if(a==="onboardingGenerateRecommendations"){') >= 0);
});

test('secondary helper-driven actions surface feedback when handlers are unavailable', function() {
  var appSource = loadJS('js/app.js');
  assert.ok(appSource.indexOf('showToast("MIDI device refresh isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('showToast("That practice item couldn\'t be started right now.")') >= 0);
  assert.ok(appSource.indexOf('showToast("That practice item couldn\'t be completed right now.")') >= 0);
  assert.ok(appSource.indexOf('function dispatchWindowAction(name, fallbackMessage, arg1, arg2) {') >= 0);
  assert.ok(/if\(a==="planStartRhythmHighway"\)\{\s*if\(typeof startRhythmHighwaySegment==="function" && startRhythmHighwaySegment\(v,appRead\("rhythmHighwayPreset", "spark_learning"\)\)\)return;\s*if\(typeof showToast === "function"\) showToast\("That practice item couldn't be started right now\."\);\s*render\(\);return;\s*\}/.test(appSource));
  assert.ok(/if\(a==="completePlanItem"\)\{\s*var completedPlanItem = false;\s*if\(window\.sparkCore\)\{\s*completeDailyPracticePlanRequest\(\{ itemId: v \}\);\s*completedPlanItem = true;\s*\} else if\(typeof markPracticePlanItem==="function"\)\{\s*markPracticePlanItem\(v\);\s*completedPlanItem = true;\s*\}\s*if\(!completedPlanItem && typeof showToast === "function"\) showToast\("That practice item couldn't be completed right now\."\);\s*render\(\);return;\s*\}/.test(appSource));
  assert.ok(/if\(a==="rhythmHighwayLoopWindow"\)\{\s*var activeCoreSegmentId=appRead\("activeCoreSegmentId", null\);\s*if\(typeof _createRhythmHighwayLoopSpec==="function" && activeCoreSegmentId\)\{[\s\S]*?if\(loopSpec && typeof startRhythmHighwaySegment==="function"\)\{[\s\S]*?return;\s*\}\s*\}\s*if\(typeof showToast === "function"\) showToast\("Looping isn't available for this rhythm session right now\."\);\s*render\(\);return;\s*\}/.test(appSource));
  assert.ok(appSource.indexOf('showToast("Rhythm strumming isn\'t available right now.")') >= 0);
  assert.ok(/if\(a==="rhythmHighwayClearLoop"\)\{\s*appWrite\("rhythmHighwayLoop",null\);\s*var clearLoopSegmentId=appRead\("activeCoreSegmentId", null\);\s*if\(clearLoopSegmentId&&typeof startRhythmHighwaySegment==="function"\)\{[\s\S]*?return;\s*\}\s*if\(typeof showToast === "function"\) showToast\("This rhythm session couldn't be restarted right now\."\);\s*render\(\);return;\s*\}/.test(appSource));
  assert.ok(/if\(a==="restartRhythmHighway"\)\{\s*if\(appRead\("activeCoreSegmentId", null\)&&typeof startRhythmHighwaySegment==="function"&&startRhythmHighwaySegment\(appRead\("activeCoreSegmentId", null\),appRead\("rhythmHighwayPreset", "spark_learning"\),appRead\("rhythmHighwayLoop", null\)\)\)return;\s*if\(typeof showToast === "function"\) showToast\("This rhythm session couldn't be restarted right now\."\);\s*return;\s*\}/.test(appSource));
  assert.ok(appSource.indexOf('dispatchWindowAction("pausePerformance", "Performance controls aren\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('dispatchWindowAction("resumePerformance", "Performance controls aren\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('dispatchWindowAction("startPerformance", "Performance isn\'t available right now.", v)') >= 0);
  assert.ok(appSource.indexOf('if(!dispatchWindowAction("stopPerformance", "Performance controls aren\'t available right now.")) return;') >= 0);
  assert.ok(appSource.indexOf('dispatchWindowAction("setPerformanceLoop", "Performance controls aren\'t available right now.", {startSec:ph.startSec,endSec:ph.endSec,phraseId:ph.id})') >= 0);
  assert.ok(appSource.indexOf('dispatchWindowAction("clearPerformanceLoop", "Performance controls aren\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('dispatchWindowAction("startCalibration", "Performance calibration isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('dispatchWindowAction("recordCalibrationTap", "Performance calibration isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('dispatchWindowAction("cancelCalibration", "Performance calibration isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('dispatchWindowAction("startPerformanceCalibrationRun", "Performance calibration isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('dispatchWindowAction("stopPerformanceCalibration", "Performance calibration isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('showToast("MIDI isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('showToast("MIDI device selection isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('showToast("Audio calibration isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('showToast("Progress reset isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('showToast("Audio input refresh isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('showToast("Audio input testing isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('showToast("Import a song before saving it.")') >= 0);
  assert.ok(appSource.indexOf('showToast("Stem separation is only available in the desktop build.")') >= 0);
  assert.ok(appSource.indexOf('showToast("Choose an audio file before separating stems.")') >= 0);
  assert.ok(appSource.indexOf('showToast("Load and separate a song before playing stems.")') >= 0);
  assert.ok(appSource.indexOf('showToast("Stem playback isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('showToast("Song audio import is only available in the desktop build.")') >= 0);
  assert.ok(appSource.indexOf('showToast("No stems were returned for that audio import.")') >= 0);
  assert.ok(appSource.indexOf('showToast("Stem separation failed: " + (err.message || err))') >= 0);
  assert.ok(appSource.indexOf('showToast("This community song isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('showToast("Highway theme switching isn\'t available right now.")') >= 0);
});

test('career page hides play CTA when unlocked song data is missing', function() {
  global.S.activeCareerId = 'career_1';
  global.SparkState.read = function(path, fallback) {
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = global.S;
    var i;
    for (i = 0; i < parts.length; i++) {
      if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  };
  global.getCareerItem = function(type, id) {
    if (type === 'careers' && id === 'career_1') return { id: 'career_1', tiers: ['tier_1'] };
    if (type === 'tiers' && id === 'tier_1') return { id: 'tier_1', title: 'Tier One', stages: ['stage_1'] };
    if (type === 'stages' && id === 'stage_1') return { id: 'stage_1', title: 'Stage One', songs: ['missing_song'] };
    return null;
  };
  global.isCareerSongUnlocked = function() { return true; };
  eval(loadJS('js/career/ui.js'));

  var html = careerPage();
  assert.ok(html.indexOf('Play') === -1);
  assert.ok(html.indexOf('Unavailable') >= 0);
});

test('career and performance daily actions surface feedback instead of silently returning', function() {
  var appSource = loadJS('js/app.js');
  assert.ok(appSource.indexOf('showToast("This career song isn\'t available yet.")') >= 0);
  assert.ok(appSource.indexOf('showToast("Challenge rewards aren\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('showToast("No performance daily is available right now.")') >= 0);
  assert.ok(appSource.indexOf('showToast("This performance song isn\'t available right now.")') >= 0);
  assert.ok(appSource.indexOf('showToast("This performance plan song isn\'t available yet.")') >= 0);
  assert.ok(appSource.indexOf('showToast("This technique-targeted performance song isn\'t available yet.")') >= 0);
  assert.ok(appSource.indexOf('dispatchWindowAction("startPerformance", "Performance isn\'t available right now.",') >= 0);
});

test('career content bootstraps from the active instrument song library', function() {
  global.S.activeCareerId = 'career_main';
  global.S.careerProgress = { unlockedTiers: {}, unlockedStages: {}, unlockedSongs: {}, songRatings: {}, stageCompletion: {}, tierCompletion: {} };
  SparkInstruments.register({
    id: 'career_test',
    instrument: 'guitar',
    name: 'Career Test Guitar',
    icon: 'C',
    skin: SparkHighway.GUITAR_SKIN,
    available: true,
    getData: function() {
      return {
        SONGS: [
          { title: 'Alpha Song', level: 1, artist: 'A' },
          { title: 'Beta Song', level: 2, artist: 'B' }
        ]
      };
    },
    pages: {},
    tabs: [],
    stemMutePreset: {},
    init: function() {}
  });
  SparkInstruments.activate('career_test');
  eval(loadJS('js/career/registry.js'));
  eval(loadJS('js/career/unlocks.js'));
  eval(loadJS('js/career/ui.js'));

  var html = careerPage();
  assert.ok(html.indexOf('No career loaded.') === -1);
  assert.ok(html.indexOf('Alpha Song') >= 0);
  assert.ok(html.indexOf('Play') >= 0);
  assert.strictEqual(global.S.activeCareerId, 'career_career_test');
});

test('career registry resolves state through the shared root helper instead of window-only fallbacks', function() {
  var registrySource = loadJS('js/career/registry.js');
  assert.ok(registrySource.indexOf('function getCareerRegistryStateRoot(){') >= 0);
  assert.ok(registrySource.indexOf('globalThis.__sparkState') >= 0);
  assert.ok(registrySource.indexOf('var cursor = typeof window!=="undefined" && window.__sparkState ? window.__sparkState : (typeof window!=="undefined" ? window.S : null);') === -1);
  assert.ok(registrySource.indexOf('var root = typeof window!=="undefined" && window.__sparkState ? window.__sparkState : (typeof window!=="undefined" ? window.S : null);') === -1);
});

test('challenge hub open initializes challenges when the cache is empty', function() {
  var appSource = loadJS('js/app.js');
  assert.ok(appSource.indexOf('if((appRead("activeChallenges", []) || []).length===0 && typeof initializeChallengesForCurrentCycle==="function"){') >= 0);
  assert.ok(appSource.indexOf('openDashboardSectionRequest("challenges");') >= 0);
});

test('community submit actions initialize draft state before editing', function() {
  var appSource = loadJS('js/app.js');
  assert.ok(appSource.indexOf('function ensureCommunitySubmitSong(){') >= 0);
  assert.ok(appSource.indexOf('if(a==="communityTab"){appWrite("communityTab",v);if(v==="submit")ensureCommunitySubmitSong();') >= 0);
  assert.ok(appSource.indexOf('var submitSong=ensureCommunitySubmitSong();') >= 0);
});

test('community API defaults to the local HTTP server and allows overrides', function() {
  var appSource = loadJS('js/app.js');
  assert.ok(appSource.indexOf('window.SPARK_COMMUNITY_URL') >= 0);
  assert.ok(appSource.indexOf('"http://localhost:3456"') >= 0);
});

test('community actions surface API errors instead of swallowing them', function() {
  var appSource = loadJS('js/app.js');
  var songsSource = loadJS('js/pages/songs.js');
  assert.ok(appSource.indexOf('if(!r.ok) throw new Error(data && data.error ? data.error : ("Community request failed: " + r.status));') >= 0);
  assert.ok(appSource.indexOf('if(!r.ok) throw new Error(data && data.error ? data.error : ("Vote failed: " + r.status));') >= 0);
  assert.ok(appSource.indexOf('if(!r.ok) throw new Error(data && data.error ? data.error : ("Submit failed: " + r.status));') >= 0);
  assert.ok(appSource.indexOf('appWrite("communityError","Add a title, artist, and at least two chords in the progression before submitting.");') >= 0);
  assert.ok(appSource.indexOf('appWrite("communityError",String((err&&err.message)||err||"Failed to submit song"));render();') >= 0);
  assert.ok(songsSource.indexOf('if(communityState.error){') >= 0);
});

test('custom practice set save surfaces validation instead of silently returning', function() {
  var appSource = loadJS('js/app.js');
  var practiceSource = loadJS('js/pages/practice.js');
  assert.ok(appSource.indexOf('appWrite("customSetError","Add a set name and at least 2 chords before saving.");') >= 0);
  assert.ok(appSource.indexOf('appWrite("customSetError",null);') >= 0);
  assert.ok(practiceSource.indexOf('customSetError: practiceStateRead("customSetError", "") || ""') >= 0);
  assert.ok(practiceSource.indexOf('if(customState.customSetError){') >= 0);
});

test('progression builder play surfaces validation instead of silently returning', function() {
  var appSource = loadJS('js/app.js');
  var gamesSource = loadJS('js/pages/games.js');
  assert.ok(appSource.indexOf('appWrite("progError","Add at least 2 chords before pressing Play.");') >= 0);
  assert.ok(appSource.indexOf('appWrite("progError",null);') >= 0);
  assert.ok(gamesSource.indexOf('var progError = gameStateRead("progError", "") || "";') >= 0);
  assert.ok(gamesSource.indexOf('if(progError){') >= 0);
});

test('drill and ear training starts surface missing-pool errors instead of silently returning', function() {
  var appSource = loadJS('js/app.js');
  var practiceSource = loadJS('js/pages/practice.js');
  assert.ok(appSource.indexOf('appWrite("drillError","No drill chords are available for this instrument yet.");') >= 0);
  assert.ok(appSource.indexOf('appWrite("earTrainError","No ear-training chords are available for this instrument yet.");') >= 0);
  assert.ok(practiceSource.indexOf('var drillError = practiceStateRead("drillError", "") || "";') >= 0);
  assert.ok(practiceSource.indexOf('error: practiceStateRead("earTrainError", "") || ""') >= 0);
});

test('inline onclick handlers stay on shared act routing', function() {
  var allowed = [
    /^act\(/,
    /^event\.stopPropagation\(\);act\(/,
    /^event\.stopPropagation\(\)$/,
    /^location\.reload\(\)$/
  ];
  var sources = [path.join(__dirname, '..', 'index.html')].concat(listJsFiles(path.join(__dirname, '..', 'js')));
  var violations = [];

  sources.forEach(function(filePath) {
    var relativePath = path.relative(path.join(__dirname, '..'), filePath);
    if (relativePath === path.join('js', 'ui.js') || relativePath === path.join('js', 'instruments', 'piano', 'ui.js')) {
      return;
    }
    var source = fs.readFileSync(filePath, 'utf8');
    var matches = source.match(/onclick="([^"]+)"/g) || [];
    matches.forEach(function(match) {
      var handler = match.replace(/^onclick="/, '').replace(/"$/, '');
      if (handler.indexOf("' +") >= 0 || handler.indexOf("+ '") >= 0 || handler.indexOf('"+') >= 0 || handler.indexOf('+"') >= 0) {
        return;
      }
      var ok = allowed.some(function(pattern) { return pattern.test(handler); });
      if (!ok) {
        violations.push(relativePath + ' -> ' + handler);
      }
    });
  });

  assert.deepStrictEqual(violations, []);
});

test('guided and piano confirm-style exits route through action handlers instead of inline confirm calls', function() {
  var guidedSource = loadJS('js/pages/guided.js');
  var pianoSessionSource = loadJS('js/instruments/piano/pages/session.js');
  var pianoToolsSource = loadJS('js/instruments/piano/pages/tools.js');
  var appSource = loadJS('js/app.js');
  var pianoAppSource = loadJS('js/instruments/piano/app.js');
  assert.ok(guidedSource.indexOf("act(\\'guidedStopConfirm\\')") >= 0);
  assert.ok(guidedSource.indexOf("if(confirm(") === -1);
  assert.ok(pianoSessionSource.indexOf("act(\\'stop_session_confirm\\')") >= 0);
  assert.ok(pianoSessionSource.indexOf("if(confirm(") === -1);
  assert.ok(pianoToolsSource.indexOf("act(\\'reset_confirm\\')") >= 0);
  assert.ok(pianoToolsSource.indexOf("if(confirm(") === -1);
  assert.ok(appSource.indexOf('if(a==="guidedStopConfirm"){') >= 0);
  assert.ok(pianoAppSource.indexOf('case "stop_session_confirm":') >= 0);
  assert.ok(pianoAppSource.indexOf('case "reset_confirm":') >= 0);
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

test('ukulele chord charts keep explicit fingering for barre-heavy shapes', function() {
  eval(loadJS('js/sparksuite/instruments/ukulele/ukulele_chords.js'));

  function getChord(name) {
    for (var i = 0; i < SparkUkuleleAllChords.length; i++) {
      if (SparkUkuleleAllChords[i].name === name) return SparkUkuleleAllChords[i];
    }
    return null;
  }

  var dChord = normalizeUkuleleChord(getChord('D'));
  var bbChord = normalizeUkuleleChord(getChord('Bb'));
  var bmChord = normalizeUkuleleChord(getChord('Bm'));

  assert.deepStrictEqual(validateChordChart(dChord), []);
  assert.deepStrictEqual(validateChordChart(bbChord), []);
  assert.deepStrictEqual(validateChordChart(bmChord), []);

  assert.deepStrictEqual(dChord.barre, { fret: 2, fromString: 0, toString: 2 });
  assert.deepStrictEqual(bbChord.barre, { fret: 1, fromString: 0, toString: 1 });
  assert.deepStrictEqual(bmChord.barre, { fret: 2, fromString: 1, toString: 3 });
  assert.ok(bmChord.fingers.some(function(finger) {
    return finger.stringIndex === 0 && finger.fret === 4;
  }));
});

test('meta skill tree helpers do not clobber the shared skill tree builder', function() {
  eval(loadJS('js/progression/skill_tree.js'));
  eval(loadJS('js/meta/skill_tree_meta.js'));
  eval(loadJS('js/pages/skill_tree.js'));

  var tree = buildSkillTree();
  assert.ok(tree);
  assert.ok(Array.isArray(tree.branches));
  assert.ok(typeof initializeMetaSkillTree === 'function');
});

test('guitar register exposes capo curriculum and lesson-specific exercises for advanced players', function() {
  eval(loadJS('js/data.js'));
  eval(loadJS('js/instruments/guitar/capo.js'));
  eval(loadJS('js/instruments/guitar/register.js'));

  var all = SparkInstruments.getAll();
  var guitar = null;
  var i;
  for (i = 0; i < all.length; i++) {
    if (all[i].id === 'chordspark') guitar = all[i];
  }

  assert.ok(guitar);
  S.level = 4;
  var curriculum = guitar.getCurriculumMap();
  assert.ok(curriculum.length >= 8);
  assert.strictEqual(curriculum[0].id, 'capo_L1');
  assert.strictEqual(curriculum[0].skill, 'capo_basics');

  var capoBasics = guitar.getExercises('capo_basics');
  assert.ok(capoBasics.some(function(exercise) { return exercise.lessonId === 'capo_L1'; }));
  assert.ok(capoBasics.some(function(exercise) { return exercise.lessonId === 'capo_L2'; }));

  var picked = guitar.pickPracticeExercise(curriculum[1], capoBasics);
  assert.ok(picked);
  assert.strictEqual(picked.lessonId, 'capo_L2');

  var lessonExercises = guitar.getExercisesForLesson('capo_L6');
  assert.strictEqual(lessonExercises.length, 1);
  assert.strictEqual(lessonExercises[0].focus, 'capo_transposition');
  assert.strictEqual(lessonExercises[0].type, 'lesson');
});

test('guitar capo curriculum routes skills to capo-specific rhythm charts', function() {
  eval(loadJS('js/sparksuite/instruments/guitar/guitar_chart_library.js'));
  eval(loadJS('js/sparksuite/instruments/guitar/guitar_rhythm_curriculum.js'));

  assert.strictEqual(
    SparkGuitarRhythmCurriculum.selectChartId({ segment: { meta: { skill: 'capo_basics' } } }),
    'capo_shapes_01'
  );
  assert.strictEqual(
    SparkGuitarRhythmCurriculum.selectChartId({ segment: { meta: { skill: 'capo_song_playing' } } }),
    'capo_progressions_01'
  );
  assert.strictEqual(
    SparkGuitarRhythmCurriculum.selectChartId({ segment: { meta: { skill: 'capo_transposition' } } }),
    'capo_transpose_01'
  );
  assert.ok(SparkGuitarChartLibrary.getChartDefinition('capo_shapes_01').notes.length > 0);
  assert.ok(SparkGuitarChartLibrary.getChartDefinition('capo_transpose_01').notes.length > 0);
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

test('performance daily button keeps a playable fallback path in shared app routing', function() {
  var appJs = loadJS('js/app.js');
  assert.ok(appJs.indexOf('var fallbackRequest = openPerformanceDailyChallengeRequest({') >= 0);
  assert.ok(appJs.indexOf('if(fallbackRequest && fallbackRequest.songData){') >= 0);
  assert.ok(appJs.indexOf('appWrite(\"performSongData\",fallbackRequest.songData);') >= 0);
  assert.ok(appJs.indexOf('appWrite(\"screen\",SCR.PERFORM_SONG);') >= 0);
});

// Summary
console.log('\n' + '='.repeat(40));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('='.repeat(40));
process.exit(failed > 0 ? 1 : 0);
