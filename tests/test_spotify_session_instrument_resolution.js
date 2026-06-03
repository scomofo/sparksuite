var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function test(name, fn) {
  Promise.resolve()
    .then(fn)
    .then(function() {
      console.log("  PASS: " + name);
    })
    .catch(function(err) {
      console.error("  FAIL: " + name);
      console.error("    " + (err && err.stack ? err.stack : err));
      process.exitCode = 1;
    });
}

console.log("\n--- Spotify Session Instrument Resolution ---");

test("session engine prefers instrumentContext.instrumentType for Spotify chart generation", function() {
  global.window = global;
  global.SessionPlan = function SessionPlan(input) {
    Object.assign(this, input);
  };
  global.SparkChartGenerationService = function SparkChartGenerationService() {};
  var captured = null;
  global.window.sparkChartService = {
    generate: function(options) {
      captured = options;
      return Promise.resolve({ trackUri: "spotify:track:test" });
    }
  };

  global.eval(loadJS("js/sparksuite/core/session_engine.js"));
  var engine = new SparkSuiteSessionEngine({}, {});

  return engine.buildSpotifyPlayAlongSession({
    trackId: "track_1",
    instrumentContext: {
      appId: "ukespark",
      instrumentType: "ukulele"
    }
  }).then(function() {
    assert.ok(captured);
    assert.strictEqual(captured.instrument, "ukulele");
  });
});

test("SparkCore.startSpotifySession prefers the active instrument type when input omits instrument", function() {
  global.window = global;
  global.SparkSuiteCore = function SparkSuiteCore() {};
  global.SparkSuiteCore.prototype.updateRuntimeState = function() {};
  global.eval(loadJS("js/sparksuite/core/spotify_integration.js"));

  var captured = null;
  var core = new SparkSuiteCore();
  core.instrumentManager = {
    getActiveContext: function() {
      return {
        appId: "pianospark",
        instrumentType: "piano"
      };
    }
  };
  core.sessionEngine = {
    buildSpotifyPlayAlongSession: function(options) {
      captured = options;
      return Promise.resolve({ id: "plan_1", segments: [{ id: "seg_1" }] });
    }
  };

  return core.startSpotifySession({ trackId: "track_2" }).then(function() {
    assert.ok(captured);
    assert.strictEqual(captured.instrument, "piano");
    assert.strictEqual(captured.instrumentContext.instrumentType, "piano");
  });
});

process.on("beforeExit", function(code) {
  if (code && code !== 0) process.exit(code);
});
