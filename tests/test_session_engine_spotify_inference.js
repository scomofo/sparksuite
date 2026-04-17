var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  global.eval(fs.readFileSync(path.join(__dirname, "..", file), "utf8"));
}

async function run() {
  global.window = global;
  global.SparkInstruments = {
    getAll: function() {
      return [{ id: "ukespark", appId: "ukespark", instrument: "ukulele" }];
    }
  };
  global.window.sparkChartService = {
    generate: function(input) {
      global._capturedSpotifyGenerate = input;
      return Promise.resolve({
        trackUri: "spotify:track:test",
        songChart: {
          song: {
            durationSec: 123
          }
        }
      });
    }
  };
  global.SparkChartGenerationService = function() {};

  loadJS("js/sparksuite/domain/types.js");
  loadJS("js/sparksuite/domain/session_segment.js");
  loadJS("js/sparksuite/domain/session.js");
  loadJS("js/sparksuite/core/session_engine.js");

  var engine = new SparkSuiteSessionEngine({}, {});

  var plan = await engine.buildSpotifyPlayAlongSession({
    trackId: "spotify_track_1",
    difficulty: "hard",
    instrumentContext: {
      instrumentId: "ukespark",
      appId: "ukespark"
    }
  });

  assert.ok(global._capturedSpotifyGenerate);
  assert.strictEqual(global._capturedSpotifyGenerate.instrument, "ukulele");
  assert.strictEqual(plan.instrumentId, "ukespark");
  assert.strictEqual(plan.context.spotifyPlayAlong.instrument, "ukulele");
  assert.strictEqual(plan.exercises[0].data.core.instrument, "ukulele");

  console.log("PASS: Session engine spotify builder infers instrument types from context");
}

run().catch(function(err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
