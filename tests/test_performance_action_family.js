var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnv() {
  global.window = global;
  global.render = function() {};
  global.saveState = function() {};
  global.performance = { now: function() { return 1234; } };
  global.SCR = {
    HOME: "home",
    PRACTICE: "practice",
    SONGS: "songs",
    PERFORM: "perform",
    PERFORM_SONG: "performSong",
    PERFORM_CALIBRATE: "performCalibrate",
    PERF_STATS: "perfStats"
  };
  global.TAB = { SONGS: "songs" };
  global.SONGS = [
    { title: "Stand By Me", artist: "Ben E. King" }
  ];
  global.S = {
    performArrangementType: "chords",
    performDifficulty: "normal",
    performSpeed: 1,
    performPracticePreset: "full_mix",
    performMode: "midi",
    performCountIn: false,
    performTargetTechnique: null,
    performSongData: null,
    performSongId: null,
    performMicOffsetMs: 64,
    performAudioOffsetMs: 18,
    performMidiOffsetMs: 7,
    performTimingOffsetMs: 5,
    performCalibrationSource: "mic",
    performChartId: "chart_1",
    performChart: {
      id: "chart_1",
      phrases: [{ id: "phrase_1", startSec: 0, endSec: 4 }]
    },
    performResults: {
      phraseStats: [
        { name: "Phrase 1", total: 2, scoreSum: 1, perfects: 1, goods: 0, oks: 0, misses: 1 }
      ]
    }
  };
  global.registeredFamily = null;
  global.window.registerSparkActionFamily = function(name, fn) {
    global.registeredFamily = fn;
  };
  global.startCalls = [];
  global.startPerformance = function(chartOrId, options) {
    startCalls.push({ chartOrId: chartOrId, options: options });
  };
  global.renderCalls = 0;
  global.render = function() { renderCalls++; };
  global.setTimeout = function(fn) { fn(); return 1; };
  global.clearTimeout = function() {};
  global.setPerformanceLoopCalls = [];
  global.setPerformanceLoop = function(payload) {
    setPerformanceLoopCalls.push(payload);
    S.performLoop = payload;
  };
  global.resolvePerformanceSongId = function(song) {
    return song.title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  };
  global.resolvePerformanceChartVariantId = function(songId, options) {
    if (songId === "stand_by_me" && options.instrument === "bass" && options.arrangementType === "rhythm_chords") {
      return "stand_by_me_bass_rhythm";
    }
    return null;
  };
  global.getActivePerformanceInstrumentType = function() {
    return "bass";
  };
  global.buildPerformanceChartFromSong = function(song, source, arrangementType) {
    return { id: "generated_" + (arrangementType || "chords"), title: song.title, arrangementType: arrangementType || "chords", events: [1], phrases: [1] };
  };
  global.startSelectedPerformanceSongRequest = function(options) { return options; };
  global.openPerformanceSongSelectionRequest = function() {};
  global.applyPerformanceCalibrationRequestCalls = [];
  global.applyPerformanceCalibrationRequest = function(action, payload) {
    applyPerformanceCalibrationRequestCalls.push({ action: action, payload: payload });
  };
  global.openPerformanceCalibrationRequestCalls = [];
  global.openPerformanceCalibrationRequest = function(payload) {
    openPerformanceCalibrationRequestCalls.push(payload || {});
  };
  global.applyPerformanceNavigationRequestCalls = [];
  global.applyPerformanceNavigationRequest = function(target, payload) {
    applyPerformanceNavigationRequestCalls.push({ target: target, payload: payload || {} });
    return { activeScreen: target === "song_detail" ? "performance_song" : "home" };
  };
  global.applySongBrowserRequestCalls = [];
  global.applySongBrowserRequest = function(action, payload) {
    applySongBrowserRequestCalls.push({ action: action, payload: payload || {} });
  };
  global.getPerformanceRetryRequest = function(options) {
    options = options || {};
    return {
      chart: Object.prototype.hasOwnProperty.call(options, "chart") ? options.chart : null,
      chartId: Object.prototype.hasOwnProperty.call(options, "chartId") ? options.chartId : S.performChartId,
      difficulty: Object.prototype.hasOwnProperty.call(options, "difficulty") ? options.difficulty : S.performDifficulty,
      speed: Object.prototype.hasOwnProperty.call(options, "speed") ? options.speed : S.performSpeed,
      preset: Object.prototype.hasOwnProperty.call(options, "preset") ? options.preset : S.performPracticePreset,
      mode: Object.prototype.hasOwnProperty.call(options, "mode") ? options.mode : S.performMode,
      targetTechnique: Object.prototype.hasOwnProperty.call(options, "targetTechnique") ? options.targetTechnique : S.performTargetTechnique,
      targetPhraseIndex: Object.prototype.hasOwnProperty.call(options, "targetPhraseIndex") ? options.targetPhraseIndex : null
    };
  };
  global.openPerformanceDailyChallengeRequestCalls = [];
  global.openPerformanceDailyChallengeRequest = function(payload) {
    openPerformanceDailyChallengeRequestCalls.push(payload || {});
  };
  global.choosePerformanceDailyChallenge = function() {
    return null;
  };
  global.stopPerformanceCalibrationCalls = 0;
  global.stopPerformanceCalibration = function() {
    stopPerformanceCalibrationCalls++;
  };
  global.recordCalibrationTapCalls = 0;
  global.recordCalibrationTap = function() {
    recordCalibrationTapCalls++;
  };
  global.cancelCalibrationCalls = 0;
  global.cancelCalibration = function() {
    cancelCalibrationCalls++;
  };
  global.stopCalibrationCalls = 0;
  global.stopCalibration = function() {
    stopCalibrationCalls++;
  };
  global.startCalibrationCalls = 0;
  global.startCalibration = function() {
    startCalibrationCalls++;
  };
  global.sparkPerformanceRunCalibrationStartCalls = 0;
  global.sparkPerformanceRunCalibrationTapCalls = 0;
  global.sparkPerformanceRunCalibrationCancelCalls = 0;
  global.SparkPerformanceRunCalibration = {
    start: function() { sparkPerformanceRunCalibrationStartCalls++; },
    tap: function() { sparkPerformanceRunCalibrationTapCalls++; },
    cancel: function() { sparkPerformanceRunCalibrationCancelCalls++; }
  };
  global.applyCalibrationOffset = function() { return 42; };
  global.getPerformanceCalibrationView = function() {
    return { source: "mic" };
  };
  global.window.sparkCore = null;
  global.SparkProgressBridge = null;
}

function test(name, fn) {
  try {
    resetEnv();
    global.eval(loadJS("js/actions/performance_family.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.stack);
    process.exitCode = 1;
  }
}

console.log("\n--- Performance Action Family ---");

test("performSongRhythm reuses canonical song start flow and variant resolution", function() {
  var handled = registeredFamily("performSongRhythm", "0");
  assert.strictEqual(handled, true);
  assert.strictEqual(S.performSongId, "stand_by_me");
  assert.strictEqual(S.performArrangementType, "rhythm_chords");
  assert.strictEqual(startCalls.length, 1);
  assert.strictEqual(startCalls[0].chartOrId, "stand_by_me_bass_rhythm");
  assert.strictEqual(startCalls[0].options.instrument, "bass");
});

test("performCalibrationApply forwards the normalized mic offset only", function() {
  S.performMicOffsetMs = null;
  S.performAudioOffsetMs = 91;
  var handled = registeredFamily("performCalibrationApply");
  assert.strictEqual(handled, true);
  assert.strictEqual(applyPerformanceCalibrationRequestCalls.length, 1);
  assert.strictEqual(applyPerformanceCalibrationRequestCalls[0].payload.micOffsetMs, 0);
});

test("performCalibrationReset clears both mic offset fields for legacy compatibility", function() {
  var handled = registeredFamily("performCalibrationReset");
  assert.strictEqual(handled, true);
  assert.strictEqual(S.performMicOffsetMs, 0);
  assert.strictEqual(S.performAudioOffsetMs, 0);
  assert.strictEqual(applyPerformanceCalibrationRequestCalls.length, 1);
  assert.strictEqual(applyPerformanceCalibrationRequestCalls[0].payload.micOffsetMs, 0);
});

test("performCalibrationTap and performCalibrationCancel delegate to page helpers", function() {
  assert.strictEqual(registeredFamily("performCalibrationTap"), true);
  assert.strictEqual(registeredFamily("performCalibrationCancel"), true);
  assert.strictEqual(recordCalibrationTapCalls, 1);
  assert.strictEqual(cancelCalibrationCalls, 1);
});

test("performCalibrate uses preserved performance-run helpers only on the live performance screen", function() {
  S.screen = SCR.PERFORM;
  assert.strictEqual(registeredFamily("performCalibrate"), true);
  assert.strictEqual(sparkPerformanceRunCalibrationStartCalls, 1);
  assert.strictEqual(startCalibrationCalls, 0);

  assert.strictEqual(registeredFamily("performCalibrationTap"), true);
  assert.strictEqual(registeredFamily("performCalibrationCancel"), true);
  assert.strictEqual(sparkPerformanceRunCalibrationTapCalls, 1);
  assert.strictEqual(sparkPerformanceRunCalibrationCancelCalls, 1);
  assert.strictEqual(recordCalibrationTapCalls, 0);
  assert.strictEqual(cancelCalibrationCalls, 0);
});

test("performCalibrate keeps the generic calibration fallback outside performance runs", function() {
  S.screen = SCR.PERFORM_CALIBRATE;
  assert.strictEqual(registeredFamily("performCalibrate"), true);
  assert.strictEqual(startCalibrationCalls, 1);
  assert.strictEqual(sparkPerformanceRunCalibrationStartCalls, 0);
});

test("performCalibrateStop delegates to the legacy calibration stop helper", function() {
  assert.strictEqual(registeredFamily("performCalibrateStop"), true);
  assert.strictEqual(stopCalibrationCalls, 1);
});

test("performance calibration back returns to song detail when opened from song detail", function() {
  S.screen = SCR.PERFORM_SONG;

  assert.strictEqual(registeredFamily("openPerformCalibration"), true);
  assert.strictEqual(S.screen, SCR.PERFORM_CALIBRATE);
  assert.strictEqual(S.performCalibrationReturnScreen, SCR.PERFORM_SONG);

  assert.strictEqual(registeredFamily("performCalibrationBack"), true);
  assert.strictEqual(stopPerformanceCalibrationCalls, 1);
  assert.deepStrictEqual(applyPerformanceNavigationRequestCalls[0], {
    target: "song_detail",
    payload: { performanceCalibrationMode: false }
  });
  assert.strictEqual(S.screen, SCR.PERFORM_SONG);
  assert.strictEqual(S.tab, TAB.SONGS);
  assert.strictEqual(S.performCalibrationReturnScreen, null);
});

test("performance calibration back respects core-owned song detail origin", function() {
  S.screen = SCR.HOME;
  window.sparkCore = {
    getRuntimeState: function() {
      return { activeScreen: "performance_song" };
    }
  };

  assert.strictEqual(registeredFamily("openPerformCalibration"), true);
  assert.strictEqual(S.screen, SCR.PERFORM_CALIBRATE);
  assert.strictEqual(S.performCalibrationReturnScreen, SCR.PERFORM_SONG);

  assert.strictEqual(registeredFamily("performCalibrationBack"), true);
  assert.deepStrictEqual(applyPerformanceNavigationRequestCalls[0], {
    target: "song_detail",
    payload: { performanceCalibrationMode: false }
  });
  assert.strictEqual(S.screen, SCR.PERFORM_SONG);
});

test("performance calibration back keeps songs-home fallback for non-song origins", function() {
  S.screen = SCR.HOME;

  assert.strictEqual(registeredFamily("openPerformCalibration"), true);
  assert.strictEqual(S.screen, SCR.PERFORM_CALIBRATE);

  assert.strictEqual(registeredFamily("performCalibrationBack"), true);
  assert.deepStrictEqual(applyPerformanceNavigationRequestCalls[0], {
    target: "songs_home",
    payload: { performanceCalibrationMode: false }
  });
  assert.strictEqual(S.screen, SCR.HOME);
  assert.strictEqual(S.tab, TAB.SONGS);
});

test("performance daily fallback opens the perform song subtab", function() {
  global.choosePerformanceDailyChallenge = function() {
    return {
      type: "full_run",
      songId: null,
      arrangementType: "chords",
      difficultyId: "easy"
    };
  };

  assert.strictEqual(registeredFamily("openPerformanceDaily"), true);
  assert.strictEqual(openPerformanceDailyChallengeRequestCalls.length, 1);
  assert.strictEqual(S.screen, SCR.HOME);
  assert.strictEqual(S.tab, TAB.SONGS);
  assert.strictEqual(S.songsSubTab, "perform");
  assert.deepStrictEqual(applySongBrowserRequestCalls[0], {
    action: "songs_subtab",
    payload: { songsSubTab: "perform" }
  });
});

test("performRetry preserves the active technique focus", function() {
  S.performChartId = "night_drive_chart";
  S.performTargetTechnique = "tap";

  var handled = registeredFamily("performRetry");

  assert.strictEqual(handled, true);
  assert.strictEqual(startCalls.length, 1);
  assert.strictEqual(startCalls[0].chartOrId, "night_drive_chart");
  assert.strictEqual(startCalls[0].options.targetTechnique, "tap");
});

test("performDoneSongs returns to the performance song list", function() {
  var handled = registeredFamily("performDoneSongs");

  assert.strictEqual(handled, true);
  assert.strictEqual(applyPerformanceNavigationRequestCalls.length, 1);
  assert.strictEqual(applyPerformanceNavigationRequestCalls[0].target, "songs_home");
  assert.strictEqual(applySongBrowserRequestCalls.length, 1);
  assert.deepStrictEqual(applySongBrowserRequestCalls[0], {
    action: "songs_subtab",
    payload: { songsSubTab: "perform" }
  });
});

test("performRetryPhrase safely no-ops without phrase targets", function() {
  S.performChart = { id: "chart_1" };
  S.performResults = {
    phraseStats: [
      { name: "Only Phrase", total: 2, scoreSum: 1, perfects: 1, goods: 0, oks: 0, misses: 1 }
    ]
  };

  var handled = registeredFamily("performRetryPhrase");

  assert.strictEqual(handled, true);
  assert.strictEqual(startCalls.length, 0);
});

test("performRetryPhrase starts weakest phrase when phrase target exists", function() {
  var handled = registeredFamily("performRetryPhrase");

  assert.strictEqual(handled, true);
  assert.strictEqual(startCalls.length, 1);
  assert.strictEqual(S.performTargetPhrase, 0);
  assert.strictEqual(startCalls[0].chartOrId, "chart_1");
  assert.strictEqual(S.performLoop.phraseId, "phrase_1");
});

if (process.exitCode) process.exit(process.exitCode);
