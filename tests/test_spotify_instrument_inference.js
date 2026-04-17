var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  global.eval(fs.readFileSync(path.join(__dirname, "..", file), "utf8"));
}

async function run() {
  global.window = global;

  function FakeSparkCore() {
    this.instrumentManager = {
      getActiveContext: function() {
        return {
          instrumentType: "ukulele",
          instrumentId: "ukespark",
          appId: "ukespark"
        };
      }
    };
    this.sessionEngine = {
      buildSpotifyPlayAlongSession: function(input) {
        global._capturedSpotifyInput = input;
        return Promise.resolve({
          id: "spotify_plan_1",
          segments: [{ id: "spotify_segment_1" }]
        });
      }
    };
    this.runtimeState = {};
  }

  FakeSparkCore.prototype.updateRuntimeState = function(next) {
    this.runtimeState = Object.assign({}, this.runtimeState, next || {});
    return this.runtimeState;
  };

  global.SparkCoreRuntime = FakeSparkCore;
  loadJS("js/sparksuite/core/spotify_integration.js");

  var core = new FakeSparkCore();

  await core.startSpotifySession({
    trackId: "spotify_track_1",
    difficulty: "hard"
  });

  assert.ok(global._capturedSpotifyInput);
  assert.strictEqual(global._capturedSpotifyInput.instrument, "ukulele");
  assert.strictEqual(global._capturedSpotifyInput.instrumentContext.instrumentId, "ukespark");
  assert.strictEqual(core.runtimeState.activeFlow, "spotify_play_along");
  assert.strictEqual(core.runtimeState.spotifyTrackId, "spotify_track_1");
  assert.strictEqual(core.runtimeState.spotifyDifficulty, "hard");

  console.log("PASS: Spotify session inherits the active instrument context");
}

run().catch(function(err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
