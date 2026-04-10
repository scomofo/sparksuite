var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;
var tests = [];

function test(name, fn) {
  tests.push({ name: name, fn: fn });
}

function loadJS(file) {
  global.eval(fs.readFileSync(path.join(__dirname, "..", file), "utf8"));
}

function resetState() {
  global.window = global;
  global.SparkDebugState = {
    last: null,
    update: function(payload) { this.last = payload; }
  };
  global.SparkTimeSource = {
    isPlaying: function() { return false; },
    getTimeMs: function() { return 0; },
    bind: function() {}
  };
  global.SparkLog = { info: function() {} };
  global.SparkCoreRuntime = function SparkCoreRuntime() {};
  global.window.SparkCoreRuntime = global.SparkCoreRuntime;
}

function bootstrap() {
  resetState();
  loadJS("js/sparksuite/core/system_wiring.js");
}

bootstrap();

console.log("=== System Wiring Tests ===");

test("processPlayAlongFrame uses visibleNotes debug data without undefined references", function() {
  var core = new SparkCoreRuntime();
  core.getPlaybackTimeMs = function() { return 2000; };
  core.getInputTimeMs = function() { return 1975; };
  var marked = 0;
  var cleared = 0;
  core._activeChart = {
    timeline: [
      { time: 1900, lane: 2, chord: "Am" },
      { time: 6000, lane: 1, chord: "C" }
    ],
    getBpm: function() { return 120; },
    sections: [{ start: 2100 }]
  };
  core.chordPredictor = {
    predictWindow: function(start, chords, windowMs) { return { start: start, count: chords.length, windowMs: windowMs }; }
  };
  core.voiceCoach = {
    markSectionBoundary: function() { marked++; },
    clearSectionBoundary: function() { cleared++; }
  };
  core.audioEngine = { isPlaying: function() { return true; } };
  core.stemMixer = { isPlaying: function() { return false; } };
  core.latencyCalibrator = { getOffset: function() { return 25; } };

  var frame = core.processPlayAlongFrame();

  assert.strictEqual(frame.visibleNotes.length, 1);
  assert.strictEqual(frame.prediction.count, 2);
  assert.strictEqual(frame.prediction.windowMs, 3000);
  assert.strictEqual(marked, 1);
  assert.strictEqual(cleared, 0);
  assert.strictEqual(SparkDebugState.last.expected, 2);
  assert.strictEqual(SparkDebugState.last.bpm, 120);
  assert.strictEqual(SparkDebugState.last.audioMode, "local");
  assert.strictEqual(SparkDebugState.last.latencyMs, 25);
});

test("completePlayAlongSession updates learner model using active user id", function() {
  var saved = null;
  var core = new SparkCoreRuntime();
  core._activeUserId = "user_123";
  core.audioEngine = { stop: function() {} };
  core.stemMixer = { stop: function() {} };
  core.playbackEngine = { stop: function() {} };
  core.performanceTracker = {
    getSummary: function() {
      return [
        { time: 10, lane: 1, hit: true, error: 20, judgement: "perfect" },
        { time: 25, lane: 2, hit: false, error: 40, judgement: "late" }
      ];
    },
    getEvents: function() {
      return [
        { time: 10, lane: 1, hit: true, error: 20, judgement: "perfect" },
        { time: 25, lane: 2, hit: false, error: 40, judgement: "late" }
      ];
    },
    getAccuracy: function() { return 0.5; }
  };
  core.heatmapGenerator = {
    generate: function(events) { return { total: events.length }; },
    findClusters: function() { return ["cluster"]; }
  };
  core.styleAnalyzer = { analyze: function() { return { feel: "steady" }; } };
  core.rewardModel = { compute: function() { return { xp: 15 }; } };
  core.policyEngine = {
    update: function(model, performance) {
      return { prior: model, score: performance.score };
    }
  };
  core.learnerModel = {
    load: function(userId) { return { userId: userId, baseline: true }; },
    save: function(userId, model) { saved = { userId: userId, model: model }; },
    toJSON: function() { return { exported: true }; }
  };
  core.feedbackEngine = { generate: function() { return { tip: "keep going" }; } };
  core.drillGenerator = { generate: function(weakAreas) { return weakAreas.slice(); } };
  core.voiceCoach = { sessionComplete: function() {} };

  var out = core.completePlayAlongSession();

  assert.strictEqual(saved.userId, "user_123");
  assert.strictEqual(saved.model.prior.userId, "user_123");
  assert.strictEqual(out.accuracy, 0.5);
  assert.strictEqual(out.performance.hits, 1);
  assert.strictEqual(out.performance.misses, 1);
  assert.ok(out.performance.weakAreas.indexOf("lane_2") >= 0);
  assert.ok(out.performance.weakAreas.indexOf("late") >= 0);
  assert.deepStrictEqual(out.reward, { xp: 15 });
  assert.deepStrictEqual(out.model, { exported: true });
});

test("startPlayAlongSession stores active params and calls chart service with a params object", function() {
  var core = new SparkCoreRuntime();
  var generatedWith = null;
  core.learnerModel = { load: function() { return { baseline: true }; } };
  core.policyEngine = { decide: function() { return { action: "maintain", difficulty: "hard" }; } };
  core.performanceTracker = { reset: function() {} };
  core.chordPredictor = { reset: function() {} };
  core.fingeringOptimizer = { reset: function() {} };
  core.chartService = {
    generate: function(params) {
      generatedWith = params;
      return Promise.resolve({ timeline: [], sections: [] });
    }
  };
  core._startAudioForSession = function() {};

  return core.startPlayAlongSession({
    trackId: "track_1",
    difficulty: "easy",
    instrument: "bass"
  }).then(function(result) {
    assert.strictEqual(core._activeParams.trackId, "track_1");
    assert.deepStrictEqual(generatedWith, {
      trackId: "track_1",
      difficulty: "hard",
      instrument: "bass"
    });
    assert.ok(result.chart);
  });
});

test("startPlayAlongSession carries title, artist, track uri, and offset into the active chart", function() {
  var core = new SparkCoreRuntime();
  core.updateRuntimeState = function(patch) { this._lastRuntimePatch = patch; };
  core.learnerModel = { load: function() { return { baseline: true }; } };
  core.policyEngine = { decide: function() { return { action: "maintain", difficulty: "normal" }; } };
  core.performanceTracker = { reset: function() {} };
  core.chordPredictor = { reset: function() {} };
  core.fingeringOptimizer = { reset: function() {} };
  core.chartService = {
    generate: function() {
      return Promise.resolve({
        trackUri: null,
        audio: {},
        songChart: { song: { title: "Old", artist: "Old" } },
        sections: []
      });
    }
  };
  core._startAudioForSession = function() {};

  return core.startPlayAlongSession({
    trackId: "track_2",
    trackUri: "spotify:track:track_2",
    title: "New Title",
    artist: "New Artist",
    audioOffsetMs: 33,
    instrument: "guitar"
  }).then(function() {
    assert.strictEqual(core._activeChart.trackUri, "spotify:track:track_2");
    assert.strictEqual(core._activeChart.songChart.song.title, "New Title");
    assert.strictEqual(core._activeChart.songChart.song.artist, "New Artist");
    assert.strictEqual(core._activeChart.audio.offset_ms, 33);
    assert.strictEqual(core._lastRuntimePatch.playAlongTransportMode, "spotify");
  });
});

test("processPlayAlongInput passes timing into voice coach evaluation", function() {
  var core = new SparkCoreRuntime();
  var evaluatedAt = null;
  core._activeChart = { timeline: [{ time: 1000, lane: 1 }] };
  core.performanceAnalyzer = { analyze: function() { return { accuracy: 0.8 }; } };
  core.performanceTracker = {
    record: function() {},
    getAccuracy: function() { return 0.75; }
  };
  core.voiceCoach = {
    evaluate: function(result, at) { evaluatedAt = at; }
  };

  var out = core.processPlayAlongInput({ time: 980, note: "A" });

  assert.ok(out.result);
  assert.strictEqual(evaluatedAt, 980);
});

test("_startAudioForSession uses playbackEngine.start for trackUri sessions", function() {
  var called = null;
  var core = new SparkCoreRuntime();
  core.playbackEngine = {
    start: function(trackUri, options) {
      called = { trackUri: trackUri, options: options };
    }
  };

  core._startAudioForSession({
    trackUri: "spotify:track:123",
    audioOffsetMs: 42,
    deviceId: "device_1"
  });

  assert.deepStrictEqual(called, {
    trackUri: "spotify:track:123",
    options: {
      audioOffsetMs: 42,
      deviceId: "device_1"
    }
  });
});

Promise.resolve().then(async function() {
  for (var i = 0; i < tests.length; i++) {
    try {
      bootstrap();
      await tests[i].fn();
      passed++;
      console.log("  PASS: " + tests[i].name);
    } catch (err) {
      failed++;
      console.error("  FAIL: " + tests[i].name + " -- " + err.message);
    }
  }

  console.log("\n" + passed + " passed, " + failed + " failed");
  if (failed > 0) process.exit(1);
}).catch(function(err) {
  console.error(err);
  process.exit(1);
});
