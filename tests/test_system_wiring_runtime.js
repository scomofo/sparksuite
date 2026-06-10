var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(function () {
      passed++;
      console.log("  PASS: " + name);
    })
    .catch(function (err) {
      failed++;
      console.error("  FAIL: " + name);
      console.error("    " + err.message);
    });
}

function resetCoreEnv() {
  global.window = global;
  global.SparkCore = function SparkCore() {};
  global.SparkInstruments = {
    getAll: function () {
      return [
        { id: "pianospark", appId: "pianospark", instrument: "piano" },
        { id: "ukespark", appId: "ukespark", instrument: "ukulele" }
      ];
    }
  };
  delete global.SparkDebugState;
  delete global.SparkTimeSource;
  delete global.SparkAudioLoader;
  eval(loadJS("js/sparksuite/core/system_wiring.js"));
}

function resetAudioChartEnv() {
  global.window = global;
  global.SparkInstruments = {
    getAll: function () {
      return [
        { id: "pianospark", appId: "pianospark", instrument: "piano" }
      ];
    }
  };
  global.SparkBeatDetector = function SparkBeatDetector() {};
  SparkBeatDetector.prototype.detect = function () {
    return {
      bpm: 120,
      confidence: 0.9,
      beats: [
        { timeSec: 0, strength: 0.8 },
        { timeSec: 0.5, strength: 0.7 },
        { timeSec: 1.0, strength: 0.6 },
        { timeSec: 1.5, strength: 0.7 }
      ],
      onsets: []
    };
  };
  global.SparkTempoMap = function SparkTempoMap(data) { this.data = data; };
  global.SparkNoteEvent = function SparkNoteEvent(data) { this.data = data; };
  global.SparkSongChart = function SparkSongChart(data) { this.data = data; };
  global.SparkPlayAlongChart = function SparkPlayAlongChart(data) {
    for (var key in data) this[key] = data[key];
  };
  eval(loadJS("js/sparksuite/audio/audio_chart_generator.js"));
}

console.log("=== System Wiring Runtime Tests ===");

(async function run() {
  await test("_generateChartFromAudio forwards the loaded buffer and normalized options", function () {
    resetCoreEnv();

    var loadedAudio = null;
    var generatorCall = null;
    global.SparkAudioLoader = {
      fromFile: function (audioFile) {
        assert.strictEqual(audioFile, "song.wav");
        return Promise.resolve({ duration: 12, id: "audio-buffer" });
      }
    };

    var core = new SparkCore();
    core.audioEngine = {
      load: function (audioData) {
        loadedAudio = audioData;
        return Promise.resolve();
      }
    };
    core.audioChartGenerator = {
      generate: function (audioData, options) {
        generatorCall = { audioData: audioData, options: options };
        return Promise.resolve({ chartId: "generated" });
      }
    };

    return core._generateChartFromAudio("song.wav", "track_1", "hard", "pianospark").then(function (chart) {
      assert.strictEqual(chart.chartId, "generated");
      assert.strictEqual(loadedAudio.id, "audio-buffer");
      assert.strictEqual(generatorCall.audioData.id, "audio-buffer");
      assert.deepStrictEqual(generatorCall.options, {
        trackId: "track_1",
        difficulty: "hard",
        instrument: "piano"
      });
    });
  });

  await test("startPlayAlongSession calls chartService.generate with an options object and normalized instrument", function () {
    resetCoreEnv();

    var captured = null;
    var core = new SparkCore();
    core.learnerModel = {
      load: function () { return { learner: true }; }
    };
    core.policyEngine = {
      decide: function () { return { difficulty: "hard", action: "play" }; }
    };
    core.performanceTracker = { reset: function () {} };
    core._startAudioForSession = function () {};
    core.chartService = {
      generate: function (options) {
        captured = options;
        return Promise.resolve({ id: "chart_1" });
      }
    };

    return core.startPlayAlongSession({
      userId: "user_1",
      trackId: "track_99",
      instrument: "pianospark"
    }).then(function (result) {
      assert.ok(result.chart);
      assert.deepStrictEqual(captured, {
        trackId: "track_99",
        difficulty: "hard",
        instrument: "piano"
      });
    });
  });

  await test("processPlayAlongFrame updates debug state from visible notes without throwing", function () {
    resetCoreEnv();

    var debugState = null;
    var markedSections = null;
    global.SparkDebugState = {
      update: function (state) {
        debugState = state;
      }
    };

    var core = new SparkCore();
    core.audioEngine = {
      isPlaying: function () { return true; },
      getTimeMs: function () { return 100; }
    };
    core.stemMixer = { isPlaying: function () { return false; } };
    core.playbackEngine = { isPlaying: function () { return false; } };
    core.latencyCalibrator = { getOffset: function () { return 15; } };
    core._activeChart = {
      timeline: [{ time: 120, lane: 2 }],
      sections: [{ start: 0, end: 1000 }],
      getBpm: function () { return 128; }
    };
    core.chordPredictor = {
      predictWindow: function () { return "predicted"; }
    };
    core.voiceCoach = {
      markSectionBoundaries: function (sections, timeMs) {
        markedSections = { sections: sections, timeMs: timeMs };
      }
    };

    var frame = core.processPlayAlongFrame();

    assert.strictEqual(frame.visibleNotes.length, 1);
    assert.strictEqual(frame.prediction, "predicted");
    assert.ok(markedSections);
    assert.strictEqual(markedSections.timeMs, 100);
    assert.ok(debugState);
    assert.strictEqual(debugState.expected, 2);
    assert.strictEqual(debugState.bpm, 128);
    assert.strictEqual(debugState.audioMode, "local");
    assert.strictEqual(debugState.latencyMs, 15);
  });

  await test("completePlayAlongSession reloads and saves the learner model with the active user id", function () {
    resetCoreEnv();

    var loadedUserId = null;
    var saved = null;
    var updatedModel = { next: "model" };

    var core = new SparkCore();
    core._activeUserId = "user_42";
    core.audioEngine = { stop: function () {} };
    core.stemMixer = { stop: function () {} };
    core.playbackEngine = { stop: function () {} };
    core.performanceTracker = {
      getSummary: function () { return { weakAreas: ["timing"] }; },
      getEvents: function () { return [{ error: 10 }]; }
    };
    core.heatmapGenerator = {
      generate: function () { return { rows: [] }; },
      findClusters: function () { return ["cluster"]; }
    };
    core.styleAnalyzer = {
      analyze: function () { return { groove: "steady" }; }
    };
    core.rewardModel = {
      compute: function () { return 25; }
    };
    core.policyEngine = {
      update: function (model, performance) {
        assert.deepStrictEqual(model, { current: "model" });
        assert.deepStrictEqual(performance, { weakAreas: ["timing"] });
        return updatedModel;
      }
    };
    core.learnerModel = {
      load: function (userId) {
        loadedUserId = userId;
        return { current: "model" };
      },
      save: function (userId, model) {
        saved = { userId: userId, model: model };
      },
      toJSON: function () {
        return { exported: true };
      }
    };
    core.feedbackEngine = {
      generate: function () { return { text: "Nice work" }; }
    };
    core.drillGenerator = {
      generate: function () { return ["timing_drill"]; }
    };
    core.voiceCoach = {
      sessionComplete: function () {}
    };
    core._computeAvgTiming = function () { return 10; };

    var result = core.completePlayAlongSession();

    assert.strictEqual(loadedUserId, "user_42");
    assert.deepStrictEqual(saved, { userId: "user_42", model: updatedModel });
    assert.strictEqual(result.reward, 25);
    assert.deepStrictEqual(result.model, { exported: true });
  });

  await test("AudioChartGenerator normalizes app-id instruments in generated charts", function () {
    resetAudioChartEnv();

    var generator = new SparkAudioChartGenerator();
    var chart = generator.generate(
      { duration: 2 },
      { trackId: "local_track", difficulty: "easy", instrument: "pianospark" }
    );

    assert.strictEqual(chart.instrument, "piano");
    assert.strictEqual(chart.trackId, "local_track");
  });

  console.log("\n" + passed + " passed, " + failed + " failed");
  if (failed > 0) process.exit(1);
})();
