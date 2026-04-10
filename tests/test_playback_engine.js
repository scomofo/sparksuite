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

function bootstrap() {
  var now = 1000;
  global.window = global;
  global.performance = {
    now: function() { return now; }
  };
  global.__setNow = function(value) { now = value; };
  loadJS("js/sparksuite/music/playback_engine.js");
}

console.log("=== Playback Engine Tests ===");

test("pause stops playback and resumes from last spotify position", function() {
  var played = [];
  var paused = 0;
  var seeks = [];
  var playbackStateCalls = 0;
  var spotify = {
    play: function(trackUri, deviceId) {
      played.push({ trackUri: trackUri, deviceId: deviceId });
      return Promise.resolve(true);
    },
    pause: function() {
      paused++;
      return Promise.resolve(true);
    },
    seek: function(positionMs) {
      seeks.push(positionMs);
      return Promise.resolve(true);
    },
    getPlaybackState: function() {
      playbackStateCalls++;
      return Promise.resolve({ is_playing: true, progress_ms: 3200 });
    }
  };
  var engine = new SparkPlaybackEngine(spotify);

  return engine.start("spotify:track:1", { deviceId: "d1" }).then(function() {
    __setNow(1800);
    engine._lastSpotifyMs = 2500;
    return engine.pause().then(function() {
      assert.strictEqual(engine.isPlaying(), false);
      assert.strictEqual(paused, 1);
      return engine.resume(null, { deviceId: "d1" }).then(function() {
        assert.strictEqual(played.length, 2);
        assert.deepStrictEqual(seeks, [2500]);
        assert.strictEqual(engine.isPlaying(), true);
        assert.strictEqual(playbackStateCalls, 0);
        engine.destroy();
      });
    });
  });
});

test("seek updates local offset and time getters", function() {
  var spotify = {
    play: function() { return Promise.resolve(true); },
    pause: function() { return Promise.resolve(true); },
    seek: function() { return Promise.resolve(true); },
    getPlaybackState: function() { return Promise.resolve({ is_playing: true, progress_ms: 0 }); }
  };
  var engine = new SparkPlaybackEngine(spotify);

  return engine.start("spotify:track:2", { audioOffsetMs: 30 }).then(function() {
    __setNow(1300);
    return engine.seekTo(1500).then(function() {
      __setNow(1600);
      assert.strictEqual(Math.round(engine.getTimeMs()), 1830);
      assert.strictEqual(Math.round(engine.getLocalTime()), 1830);
      engine.destroy();
    });
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
