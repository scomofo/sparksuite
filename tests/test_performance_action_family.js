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
    performCalibrationSource: "mic"
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

test("performCalibrateStop delegates to the legacy calibration stop helper", function() {
  assert.strictEqual(registeredFamily("performCalibrateStop"), true);
  assert.strictEqual(stopCalibrationCalls, 1);
});

if (process.exitCode) process.exit(process.exitCode);
