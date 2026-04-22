var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function test(name, fn) {
  Promise.resolve()
    .then(fn)
    .then(function () {
      console.log("  PASS: " + name);
    })
    .catch(function (err) {
      console.error("  FAIL: " + name);
      console.error("    " + (err && err.stack ? err.stack : err));
      process.exitCode = 1;
    });
}

console.log("\n--- Chart Generation Service Instrument Resolution ---");

test("ChartGenerationService normalizes app-id instruments before caching and building charts", function () {
  global.window = global;
  global.SparkInstruments = {
    getAll: function () {
      return [
        { id: "pianospark", appId: "pianospark", instrument: "piano" }
      ];
    }
  };
  global.SparkPatternLibrary = {
    rhythm: { easy: [1, 0, 1, 0] },
    strumming: { easy: [1, 0, 1, 0] }
  };
  global.SparkChartBuilder = function SparkChartBuilder() {};
  global.SparkDifficultyScaler = function SparkDifficultyScaler() {};
  global.SparkChordProgressionEngine = function SparkChordProgressionEngine() {};

  SparkDifficultyScaler.prototype.apply = function (chart) {
    return chart;
  };
  SparkChordProgressionEngine.prototype.buildChordTimeline = function () {
    return [{ time: 0, chord: "C", duration: 1000 }];
  };

  var builderCalls = [];
  var analyzerCalls = [];
  var analyzer = {
    analyzeWithMetadata: function (trackId) {
      analyzerCalls.push(trackId);
      return Promise.resolve({
        bpm: 120,
        title: "Song",
        artist: "Artist",
        durationMs: 1000
      });
    }
  };
  var builder = {
    build: function (params) {
      builderCalls.push(params);
      return {
        instrument: params.analysis.instrument,
        difficulty: params.difficulty,
        trackId: params.trackId
      };
    }
  };

  global.eval(loadJS("js/sparksuite/music/chart_generation_service.js"));
  var service = new SparkChartGenerationService({
    analyzer: analyzer,
    builder: builder,
    scaler: new SparkDifficultyScaler(),
    progressionEngine: new SparkChordProgressionEngine()
  });

  return service.generate({
    trackId: "track_7",
    difficulty: "easy",
    instrument: "pianospark"
  }).then(function (chart) {
    assert.strictEqual(chart.instrument, "piano");
    assert.strictEqual(builderCalls.length, 1);
    assert.strictEqual(builderCalls[0].analysis.instrument, "piano");

    return service.generate({
      trackId: "track_7",
      difficulty: "easy",
      instrument: "pianospark"
    }).then(function (cachedChart) {
      assert.strictEqual(cachedChart, chart);
      assert.strictEqual(analyzerCalls.length, 1);
      assert.strictEqual(builderCalls.length, 1);
    });
  });
});

test("SparkChartBuilder normalizes app-id instruments for direct callers", function () {
  global.window = global;
  global.SparkInstruments = {
    getAll: function () {
      return [
        { id: "pianospark", appId: "pianospark", instrument: "piano" }
      ];
    }
  };
  global.SparkNoteEvent = function SparkNoteEvent(data) { this.data = data; };
  global.SparkTempoMap = function SparkTempoMap(data) { this.data = data; };
  global.SparkSongChart = function SparkSongChart(data) { this.data = data; };
  global.SparkPlayAlongChart = function SparkPlayAlongChart(data) {
    for (var key in data) this[key] = data[key];
  };

  global.eval(loadJS("js/sparksuite/music/chart_builder.js"));
  var builder = new SparkChartBuilder();
  var chart = builder.build({
    trackId: "track_direct",
    bpm: 120,
    difficulty: "easy",
    patterns: { rhythm: [1, 0, 1, 0] },
    chords: [{ time: 0, chord: "C", duration: 1000 }],
    analysis: {
      title: "Song",
      artist: "Artist",
      durationMs: 1000,
      instrument: "pianospark"
    }
  });

  assert.strictEqual(chart.instrument, "piano");
});

process.on("beforeExit", function (code) {
  if (code && code !== 0) process.exit(code);
});
