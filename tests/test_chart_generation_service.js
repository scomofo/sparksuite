var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  global.eval(fs.readFileSync(path.join(__dirname, "..", file), "utf8"));
}

function createStorage() {
  var store = {};
  return {
    getItem: function(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem: function(key, value) {
      store[key] = String(value);
    },
    removeItem: function(key) {
      delete store[key];
    },
    key: function(index) {
      return Object.keys(store)[index] || null;
    },
    clear: function() {
      store = {};
    },
    dump: function() {
      return Object.assign({}, store);
    }
  };
}

function bootstrap() {
  global.window = global;
  global.localStorage = createStorage();
  global.SparkInstruments = {
    getAll: function() {
      return [{ id: "pianospark", appId: "pianospark", instrument: "piano" }];
    }
  };
  global.SparkChartBuilder = function() {};
  global.SparkChartBuilder.prototype.build = function(payload) {
    return {
      analysis: payload.analysis,
      toJSON: function() { return { instrument: payload.analysis.instrument }; }
    };
  };
  global.SparkDifficultyScaler = function() {};
  global.SparkDifficultyScaler.prototype.apply = function(chart) { return chart; };
  global.SparkChordProgressionEngine = function() {};
  global.SparkChordProgressionEngine.prototype.buildChordTimeline = function() { return []; };
  global.SparkPatternLibrary = {
    rhythm: { easy: [] },
    strumming: { easy: [] }
  };
  global.SparkPlayAlongChart = {
    fromJSON: function(value) { return value; }
  };
  loadJS("js/sparksuite/music/chart_generation_service.js");
}

async function run() {
  bootstrap();

  var analyzeCalls = 0;
  var service = new SparkChartGenerationService({
    analyzer: {
      analyzeWithMetadata: function(trackId) {
        analyzeCalls += 1;
        return Promise.resolve({ bpm: 120, trackId: trackId });
      }
    }
  });

  var chart = await service.generate({
    trackId: "track_1",
    difficulty: "easy",
    instrument: "pianospark"
  });

  assert.strictEqual(chart.analysis.instrument, "piano");
  assert.strictEqual(analyzeCalls, 1);

  var cached = await service.generate({
    trackId: "track_1",
    difficulty: "easy",
    instrument: "piano"
  });

  assert.strictEqual(cached.analysis.instrument, "piano");
  assert.strictEqual(analyzeCalls, 1);

  service.cacheChart("track_2", { toJSON: function() { return { ok: true }; } }, "hard", "pianospark");
  var keys = Object.keys(global.localStorage.dump());
  assert.ok(keys.indexOf("sparksuite_chart_track_2_hard_piano") >= 0);

  console.log("=== Chart Generation Service Tests ===");
  console.log("3 passed, 0 failed");
}

run().catch(function(err) {
  console.error("=== Chart Generation Service Tests ===");
  console.error("FAIL:", err && err.stack ? err.stack : err);
  process.exit(1);
});
