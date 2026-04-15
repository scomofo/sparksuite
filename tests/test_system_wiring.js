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
  loadJS("js/sparksuite/input/input_note_mapper.js");
  loadJS("js/sparksuite/input/chord_stabilizer.js");
  loadJS("js/sparksuite/input/multi_frequency_chord_detector.js");
  loadJS("js/sparksuite/analysis/performance_analyzer.js");
  loadJS("js/sparksuite/analysis/chord_confidence.js");
  loadJS("js/sparksuite/core/ai_engine.js");
  loadJS("js/ai/ai_coach.js");
  loadJS("js/ai/ai_session_analysis.js");
  loadJS("js/sparksuite/core/play_along_expected_event.js");
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
  assert.strictEqual(SparkDebugState.last.expected, "Am");
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
  var analyzeArgs = null;
  core._activeChart = { timeline: [{ time: 1000, lane: 1 }] };
  core.performanceAnalyzer = {
    analyze: function(expected, detected, timingErrorMs) {
      analyzeArgs = {
        expected: expected,
        detected: detected,
        timingErrorMs: timingErrorMs
      };
      return { accuracy: 0.8 };
    }
  };
  core.performanceTracker = {
    record: function() {},
    getAccuracy: function() { return 0.75; }
  };
  core.voiceCoach = {
    evaluate: function(result, at) { evaluatedAt = at; }
  };

  var out = core.processPlayAlongInput({ time: 980, note: "A" });

  assert.ok(out.result);
  assert.deepStrictEqual(analyzeArgs, {
    expected: null,
    detected: "A",
    timingErrorMs: -20
  });
  assert.strictEqual(evaluatedAt, 980);
});

test("processPlayAlongInput scores chord confidence from detected notes and timing", function() {
  var scoredWith = null;
  var core = new SparkCoreRuntime();
  core._activeChart = { timeline: [{ time: 1000, lane: 1, chord: "C" }] };
  core.performanceAnalyzer = { analyze: function() { return { accuracy: 0.9 }; } };
  core.performanceTracker = {
    record: function() {},
    getAccuracy: function() { return 0.9; }
  };
  core.chordConfidence = {
    score: function(chord, detectedNotes, options) {
      scoredWith = {
        chord: chord,
        detectedNotes: detectedNotes,
        options: options
      };
      return { chord: chord, confidence: 0.77 };
    }
  };

  var out = core.processPlayAlongInput({
    time: 980,
    chord: "C",
    note: "E",
    detectedNotes: ["C", "E", "G"],
    confidence: 0.65
  });

  assert.deepStrictEqual(scoredWith, {
    chord: "C",
    detectedNotes: ["C", "E", "G"],
    options: {
      timingErrorMs: -20,
      stability: 0.65
    }
  });
  assert.deepStrictEqual(out.chordResult, { chord: "C", confidence: 0.77 });
});

test("multi-frequency detector extracts notes and applies confidence gating", function() {
  var detector = new SparkMultiFrequencyChordDetector({
    chordDetector: {
      detect: function(notes) {
        return notes.indexOf("C") >= 0 ? "C" : null;
      }
    },
    stabilizer: new SparkChordStabilizer(),
    minConfidence: 0.6
  });

  var analyser = {
    frequencyBinCount: 8,
    fftSize: 16,
    getByteFrequencyData: function(buffer) {
      for (var i = 0; i < buffer.length; i++) buffer[i] = 0;
      buffer[1] = 120;
      buffer[2] = 110;
      buffer[3] = 95;
    }
  };

  var pitchDetector = {
    detect: function() { return 261.63; },
    frequencyToNote: function() { return "C"; }
  };

  var frame1 = detector.detect(analyser, 2048, pitchDetector, new Float32Array([0.2, 0.1]));
  var frame2 = detector.detect(analyser, 2048, pitchDetector, new Float32Array([0.2, 0.1]));
  var frame3 = detector.detect(analyser, 2048, pitchDetector, new Float32Array([0.2, 0.1]));

  assert.ok(frame1.notes.indexOf("C") >= 0);
  assert.ok(frame1.frequencies.length >= 1);
  assert.strictEqual(frame1.chord, null);
  assert.ok(frame3.confidence >= 0.6);
  assert.strictEqual(frame3.chord, "C");
});

test("processPlayAlongInput uses expected event timing helper for bar beat charts", function() {
  var core = new SparkCoreRuntime();
  core._activeChart = {
    bpm: 120,
    timeSignature: 4,
    timeline: [
      { bar: 1, beat: 2, chord: "C" }
    ]
  };
  core.performanceAnalyzer = new SparkPerformanceAnalyzer();
  core.performanceTracker = {
    record: function() {},
    getAccuracy: function() { return 1; }
  };
  core.chordConfidence = new SparkChordConfidence();

  var out = core.processPlayAlongInput({
    time: 520,
    note: "C",
    chord: "C",
    confidence: 0.82,
    detectedNotes: ["C", "E", "G"]
  });

  assert.strictEqual(out.delta, 20);
  assert.strictEqual(out.result.rating, "perfect");
  assert.strictEqual(out.expectedEvent.chord, "C");
  assert.strictEqual(SparkDebugState.last.expected, "C");
  assert.strictEqual(SparkDebugState.last.timing, "perfect");
  assert.strictEqual(SparkDebugState.last.feedback, null);
});

test("processPlayAlongInput adds realtime AI feedback for mismatched or late chords", function() {
  var core = new SparkCoreRuntime();
  core.aiEngine = new SparkAIEngine();
  core._activeChart = {
    timeline: [
      { time: 1000, chord: "Am" }
    ]
  };
  core.performanceAnalyzer = new SparkPerformanceAnalyzer();
  core.performanceTracker = {
    record: function() {},
    getAccuracy: function() { return 0.5; }
  };

  var wrong = core.processPlayAlongInput({
    time: 1000,
    note: "C",
    chord: "C",
    confidence: 0.7,
    detectedNotes: ["C", "E", "G"]
  });
  assert.strictEqual(wrong.feedback, "Wrong chord");
  assert.strictEqual(SparkDebugState.last.feedback, "Wrong chord");

  var late = core.processPlayAlongInput({
    time: 1130,
    note: "Am",
    chord: "Am",
    confidence: 0.7,
    detectedNotes: ["A", "C", "E"]
  });
  assert.strictEqual(late.feedback, "Too slow");
  assert.strictEqual(SparkDebugState.last.feedback, "Too slow");
});

test("completePlayAlongSession returns aiInsights and updates debug insight fields", function() {
  var saved = null;
  var core = new SparkCoreRuntime();
  core.aiEngine = new SparkAIEngine();
  core._activeUserId = "user_ai";
  core.audioEngine = { stop: function() {} };
  core.stemMixer = { stop: function() {} };
  core.playbackEngine = { stop: function() {} };
  core.performanceTracker = {
    getSummary: function() {
      return [
        { time: 10, lane: 1, hit: false, error: 140, judgement: "miss", expectedChord: "Am", detectedChord: "C" },
        { time: 20, lane: 2, hit: true, error: 130, judgement: "late", expectedChord: "C", detectedChord: "C" },
        { time: 30, lane: 3, hit: true, error: -140, judgement: "early", expectedChord: "G", detectedChord: "G" }
      ];
    },
    getEvents: function() {
      return [
        { time: 10, lane: 1, hit: false, error: 140, judgement: "miss", expectedChord: "Am", detectedChord: "C" },
        { time: 20, lane: 2, hit: true, error: 130, judgement: "late", expectedChord: "C", detectedChord: "C" },
        { time: 30, lane: 3, hit: true, error: -140, judgement: "early", expectedChord: "G", detectedChord: "G" }
      ];
    },
    getAccuracy: function() { return 2 / 3; }
  };
  core.heatmapGenerator = {
    generate: function(events) { return { total: events.length }; },
    findClusters: function() { return []; }
  };
  core.styleAnalyzer = { analyze: function() { return { feel: "steady" }; } };
  core.rewardModel = { compute: function() { return { xp: 10 }; } };
  core.policyEngine = { update: function(model) { return model; } };
  core.learnerModel = {
    load: function() { return { userId: "user_ai" }; },
    save: function(userId, model) { saved = { userId: userId, model: model }; },
    toJSON: function() { return { exported: true }; }
  };
  core.feedbackEngine = { generate: function() { return []; } };
  core.drillGenerator = { generate: function() { return []; } };
  core.voiceCoach = { sessionComplete: function() {} };

  var out = core.completePlayAlongSession();

  assert.strictEqual(saved.userId, "user_ai");
  assert.strictEqual(out.aiInsights.chordErrors.Am, 1);
  assert.strictEqual(out.aiInsights.lateHits, 2);
  assert.strictEqual(out.aiInsights.earlyHits, 1);
  assert.strictEqual(out.coaching.lateHits, 2);
  assert.strictEqual(SparkDebugState.last.aiChordErrors, "Am:1");
  assert.strictEqual(SparkDebugState.last.aiLateHits, 2);
  assert.strictEqual(SparkDebugState.last.aiEarlyHits, 1);
});

test("startMicDetection uses mic start and multi-note detector output", function() {
  var scheduled = null;
  var received = null;
  global.requestAnimationFrame = function(fn) {
    scheduled = fn;
    return 1;
  };

  var core = new SparkCoreRuntime();
  core.micInput = {
    start: function() { return Promise.resolve(); },
    getAnalyser: function() { return { frequencyBinCount: 4, fftSize: 8, getByteFrequencyData: function() {} }; },
    getTimeDomainData: function() { return new Float32Array([0.1, 0.2, 0.3]); },
    getSampleRate: function() { return 48000; }
  };
  core.pitchDetector = {
    detect: function() { return 440; },
    frequencyToNote: function() { return "A"; }
  };
  core.multiChordDetector = {
    reset: function() {},
    detect: function() {
      return {
        notes: ["C", "E", "G"],
        chord: "C",
        confidence: 0.82,
        rawChord: "C",
        pitchNote: "C",
        frequencies: [261.63, 329.63, 392.0]
      };
    }
  };
  core.processPlayAlongInput = function(inputEvent) {
    received = inputEvent;
  };
  core.getInputTimeMs = function() { return 1234; };

  return core.startMicDetection().then(function() {
    scheduled();
    assert.deepStrictEqual(received, {
      time: 1234,
      note: "C",
      chord: "C",
      confidence: 0.82,
      detectedNotes: ["C", "E", "G"],
      rawChord: "C",
      frequencies: [261.63, 329.63, 392.0]
    });
  });
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
