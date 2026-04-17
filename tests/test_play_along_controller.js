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
  global.S = {
    screen: "playAlongSession",
    playAlongPaused: false,
    playAlongLoop: false,
    playAlongSectionIndex: 0,
    spotifyDifficulty: "easy",
    spotifySavedTracks: []
  };
  global.__sparkState = global.S;
  global.SCR = {
    PLAY_ALONG: "playAlong",
    PLAY_ALONG_SESSION: "playAlongSession",
    PLAY_ALONG_RESULTS: "playAlongResults"
  };
  global.render = function() {};
  global.setTimeout = function(fn) { fn(); return 1; };
  global.cancelAnimationFrame = function() {};
  global._rafCallback = null;
  global.requestAnimationFrame = function(fn) { global._rafCallback = fn; return 13; };
  global._playAlongAnimFrame = 12;
  global.document = {
    getElementById: function() { return null; }
  };
  global.sparkCore = {
    lastSessionOutcome: null,
    getLastSessionOutcome: function() { return this.lastSessionOutcome; },
    setLastSessionOutcome: function(outcome) {
      this.lastSessionOutcome = outcome || null;
      return this.lastSessionOutcome;
    },
    getPlaybackTimeMs: function() { return 1234; },
    completePlayAlongSession: function() {
      return {
        accuracy: 0.72,
        timing: 0.81,
        consistency: 0.65,
        feedback: ["Nice work"],
        drills: [{ label: "Fix timing" }]
      };
    },
    _activeParams: { trackId: "abc" },
    getActivePlayAlongParams: function() { return this._activeParams; },
    startPlayAlongSession: function(params) {
      this.startedWith = params;
      return Promise.resolve(true);
    },
    audioEngine: {
      buffer: { duration: 10 },
      stop: function() { global._audioStopped = true; },
      play: function(offsetSec) { global._audioPlayedAt = offsetSec; },
      setPlaybackRate: function(rate) { global._audioRate = rate; }
    },
    _activeChart: {
      sections: [
        { name: "Verse", startMs: 2000, endMs: 6000 },
        { name: "Chorus", startMs: 6000, endMs: 9000 }
      ]
    },
    getActivePlayAlongChart: function() { return this._activeChart; },
    startPlayAlongRenderLoop: function(options) {
      var self = this;
      this._renderLoopOptions = options || {};
      this._playAlongLoopFrameId = requestAnimationFrame(function loop() {
        var result;
        if (self._renderLoopOptions && typeof self._renderLoopOptions.enforceLoopWindow === "function" && self._renderLoopOptions.enforceLoopWindow()) {
          self._playAlongLoopFrameId = null;
          return;
        }
        result = typeof self.processPlayAlongFrame === "function" ? self.processPlayAlongFrame() : null;
        if (result && self._renderLoopOptions && typeof self._renderLoopOptions.onFrame === "function") {
          self._renderLoopOptions.onFrame(result);
        }
        self._playAlongLoopFrameId = requestAnimationFrame(loop);
      });
      return this._playAlongLoopFrameId;
    },
    stopPlayAlongRenderLoop: function() {
      this._playAlongLoopFrameId = null;
    },
    pausePlayAlongTransport: function() {
      this._pausedPlaybackTimeMs = this.getPlaybackTimeMs();
      if (this.audioEngine && typeof this.audioEngine.stop === "function") this.audioEngine.stop();
      return this._pausedPlaybackTimeMs;
    },
    resumePlayAlongTransport: function() {
      var offsetMs = typeof this._pausedPlaybackTimeMs === "number" ? this._pausedPlaybackTimeMs : 0;
      if (this.audioEngine && this.audioEngine.buffer && typeof this.audioEngine.play === "function") {
        this.audioEngine.play(offsetMs / 1000);
      }
      this._pausedPlaybackTimeMs = null;
      return offsetMs;
    },
    seekPlayAlongToMs: function(targetMs) {
      this._pausedPlaybackTimeMs = targetMs;
      if (this.audioEngine && this.audioEngine.buffer && typeof this.audioEngine.play === "function") {
        this.audioEngine.play(targetMs / 1000);
        this._pausedPlaybackTimeMs = null;
      }
      return true;
    },
    setPlayAlongPlaybackRate: function(rate) {
      if (this.audioEngine && typeof this.audioEngine.setPlaybackRate === "function") {
        this.audioEngine.setPlaybackRate(rate);
      }
      return true;
    },
    spotifyClient: {
      getAudioFeatures: function() {
        return Promise.resolve({ tempo: 124.4 });
      }
    },
    spotifySearch: {
      searchDebounced: function(query, cb) {
        cb(global._searchResults || []);
      }
    }
  };
  global.SparkInstruments = {
    getActive: function() { return null; }
  };
  global.saveState = function() {};
  global.toasts = [];
  global.showToast = function(msg) { toasts.push(msg); };
  global.getSparkPlayAlongDemos = function() {
    return [{
      trackId: "demo_song_1",
      title: "Sunrise Drive",
      artist: "SparkSuite Demo",
      audioOffsetMs: 24,
      difficulty: "easy",
      instrument: "guitar"
    }];
  };
  global._audioStopped = false;
  global._audioPlayedAt = null;
  global._audioRate = null;
}

function bootstrap() {
  resetState();
  loadJS("js/sparksuite/core/play_along_state_service.js");
  loadJS("js/sparksuite/core/play_along_action_service.js");
  loadJS("js/sparksuite/core/play_along_renderer.js");
  loadJS("js/pages/play_along_controller.js");
}

function bootstrapWithoutRender() {
  resetState();
  delete global.render;
  loadJS("js/sparksuite/core/play_along_state_service.js");
  loadJS("js/sparksuite/core/play_along_action_service.js");
  loadJS("js/sparksuite/core/play_along_renderer.js");
  loadJS("js/pages/play_along_controller.js");
}

console.log("=== Play Along Controller Tests ===");

test("sparkPlayAlongStop stores outcome for results screen", function() {
  sparkPlayAlongStop();

  assert.ok(sparkCore.lastSessionOutcome);
  assert.strictEqual(sparkCore.lastSessionOutcome.accuracy, 0.72);
  assert.strictEqual(S.screen, SCR.PLAY_ALONG_RESULTS);
});

test("sparkPlayAlongReplay reuses active params", async function() {
  await sparkPlayAlongReplay();
  assert.deepStrictEqual(sparkCore.startedWith, { trackId: "abc", instrument: "guitar" });
  assert.strictEqual(S.screen, SCR.PLAY_ALONG_SESSION);
});

test("sparkPlayAlongReplay falls back to the active registered instrument id", async function() {
  sparkCore.runtimeState = null;
  global.SparkInstruments = {
    getActive: function() {
      return { id: "pianospark", instrument: "piano" };
    }
  };

  await sparkPlayAlongReplay();

  assert.deepStrictEqual(sparkCore.startedWith, { trackId: "abc", instrument: "pianospark" });
  assert.strictEqual(S.screen, SCR.PLAY_ALONG_SESSION);
});

test("sparkPlayAlongStartDrill relaunches current session into drill loop", async function() {
  sparkCore.lastSessionOutcome = {
    drills: [{ label: "Fix timing", startMs: 3200, endMs: 5200, speed: 0.75 }]
  };

  var ok = sparkPlayAlongStartDrill(0);
  await Promise.resolve();

  assert.strictEqual(ok, true);
  assert.strictEqual(S.playAlongSelectedDrill.label, "Fix timing");
  assert.strictEqual(S.screen, SCR.PLAY_ALONG_SESSION);
  assert.strictEqual(S.playAlongLoop, true);
  assert.deepStrictEqual(S.playAlongLoopRange, { startMs: 3200, endMs: 5200 });
  assert.strictEqual(S.playAlongSpeed, "0.75");
  assert.strictEqual(global._audioRate, 0.75);
  assert.strictEqual(global._audioPlayedAt, 3.2);
  assert.deepStrictEqual(sparkCore.startedWith, { trackId: "abc", instrument: "guitar" });
});

test("sparkPlayAlongTogglePause stores current position and resumes local audio", function() {
  var paused = sparkPlayAlongTogglePause();

  assert.strictEqual(paused, true);
  assert.strictEqual(S.playAlongPaused, true);
  assert.strictEqual(sparkCore._pausedPlaybackTimeMs, 1234);
  assert.strictEqual(global._audioStopped, true);

  var resumed = sparkPlayAlongTogglePause();

  assert.strictEqual(resumed, false);
  assert.strictEqual(S.playAlongPaused, false);
  assert.strictEqual(global._audioPlayedAt, 1.234);
  assert.strictEqual(sparkCore._pausedPlaybackTimeMs, null);
});

test("sparkPlayAlongToggleLoop derives first section loop window", function() {
  var looped = sparkPlayAlongToggleLoop();

  assert.strictEqual(looped, true);
  assert.strictEqual(S.playAlongLoop, true);
  assert.deepStrictEqual(S.playAlongLoopRange, { startMs: 2000, endMs: 6000 });

  var disabled = sparkPlayAlongToggleLoop();

  assert.strictEqual(disabled, false);
  assert.strictEqual(S.playAlongLoop, false);
  assert.strictEqual(S.playAlongLoopRange, null);
});

test("sparkPlayAlongSetLoopTarget prefers section when requested", function() {
  S.playAlongSelectedDrill = { label: "Fix timing", startMs: 3200, endMs: 5200 };

  var ok = sparkPlayAlongSetLoopTarget("section");

  assert.strictEqual(ok, true);
  assert.strictEqual(S.playAlongLoopTarget, "section");
  assert.deepStrictEqual(S.playAlongLoopRange, { startMs: 2000, endMs: 6000 });
});

test("sparkPlayAlongReplay preserves selected drill loop context", async function() {
  S.playAlongSelectedDrill = { label: "Fix timing", startMs: 3200, endMs: 5200, speed: 0.75 };
  S.playAlongLoop = true;
  S.playAlongLoopRange = { startMs: 3200, endMs: 5200 };

  await sparkPlayAlongReplay();
  await Promise.resolve();

  assert.strictEqual(S.screen, SCR.PLAY_ALONG_SESSION);
  assert.strictEqual(S.playAlongLoop, true);
  assert.deepStrictEqual(S.playAlongLoopRange, { startMs: 3200, endMs: 5200 });
  assert.strictEqual(global._audioPlayedAt, 3.2);
});

test("drill loop auto-stops when target reps are completed", function() {
  var frameCalls = 0;
  sparkCore.getPlaybackTimeMs = function() { return 5300; };
  sparkCore.processPlayAlongFrame = function() {
    frameCalls++;
    return { timeMs: 5300, visibleNotes: [] };
  };
  sparkCore.completePlayAlongSession = function() {
    return {
      accuracy: 0.9,
      timing: 0.9,
      consistency: 0.9,
      feedback: [],
      drills: []
    };
  };
  S.playAlongSelectedDrill = { label: "Fix timing", startMs: 3200, endMs: 5200, repetitions: 2 };
  S.playAlongLoop = true;
  S.playAlongLoopRange = { startMs: 3200, endMs: 5200 };
  S.playAlongLoopIteration = 2;

  sparkPlayAlongStartLoop();
  global._rafCallback();

  assert.strictEqual(frameCalls, 0);
  assert.strictEqual(S.screen, SCR.PLAY_ALONG_RESULTS);
  assert.strictEqual(S.playAlongLoop, false);
  assert.strictEqual(S.playAlongLoopProgress, 100);
  assert.ok(sparkCore.lastSessionOutcome);
  assert.ok(sparkCore.lastSessionOutcome.drillSummary);
  assert.strictEqual(sparkCore.lastSessionOutcome.drillSummary.metTarget, true);
});

test("sparkPlayAlongLaunchDemo launches curated song metadata", async function() {
  var ok = sparkPlayAlongLaunchDemo(0);
  await Promise.resolve();

  assert.strictEqual(ok, true);
  assert.strictEqual(S.screen, SCR.PLAY_ALONG_SESSION);
  assert.deepStrictEqual(sparkCore.startedWith, {
    trackId: "demo_song_1",
    trackUri: null,
    title: "Sunrise Drive",
    artist: "SparkSuite Demo",
    audioOffsetMs: 24,
    difficulty: "easy",
    instrument: "guitar"
  });
});

test("launch remembers recent play along songs", async function() {
  sparkPlayAlongLaunchDemo(0);
  await Promise.resolve();

  assert.ok(Array.isArray(S.playAlongRecent));
  assert.strictEqual(S.playAlongRecent.length, 1);
  assert.strictEqual(S.playAlongRecent[0].title, "Sunrise Drive");
  assert.strictEqual(S.playAlongRecent[0].transportMode, "generated");
});

test("sparkPlayAlongLaunchRecent replays remembered params", async function() {
  S.playAlongRecent = [{
    trackId: "demo_song_1",
    title: "Sunrise Drive",
    params: {
      trackId: "demo_song_1",
      title: "Sunrise Drive",
      difficulty: "easy",
      instrument: "guitar"
    }
  }];

  var ok = sparkPlayAlongLaunchRecent(0);
  await Promise.resolve();

  assert.strictEqual(ok, true);
  assert.strictEqual(sparkCore.startedWith.trackId, "demo_song_1");
});

test("sparkPlayAlongSaveTrack persists a searchable Spotify track with bpm metadata", async function() {
  global._searchResults = [{
    id: "spotify_track_1",
    uri: "spotify:track:spotify_track_1",
    name: "Seven Nation Army",
    artist: "The White Stripes",
    duration: 231000,
    image: "https://example.com/cover.jpg"
  }];
  sparkPlayAlongSearch("seven");
  await Promise.resolve();

  var ok = await sparkPlayAlongSaveTrack(0);

  assert.strictEqual(ok, true);
  assert.strictEqual(S.spotifySavedTracks.length, 1);
  assert.strictEqual(S.spotifySavedTracks[0].trackId, "spotify_track_1");
  assert.strictEqual(S.spotifySavedTracks[0].bpm, 124);
  assert.strictEqual(S.spotifySavedTracks[0].params.trackId, "spotify_track_1");
});

test("sparkPlayAlongLaunchSaved replays a saved Spotify song", async function() {
  S.spotifySavedTracks = [{
    trackId: "spotify_track_1",
    title: "Seven Nation Army",
    params: {
      trackId: "spotify_track_1",
      trackUri: "spotify:track:spotify_track_1",
      title: "Seven Nation Army",
      artist: "The White Stripes",
      difficulty: "easy",
      instrument: "guitar"
    }
  }];

  var ok = sparkPlayAlongLaunchSaved(0);
  await Promise.resolve();

  assert.strictEqual(ok, true);
  assert.strictEqual(sparkCore.startedWith.trackId, "spotify_track_1");
});

test("sparkPlayAlongConnectSpotify surfaces feedback when Spotify integration is unavailable", async function() {
  var ok = await sparkPlayAlongConnectSpotify();

  assert.strictEqual(ok, false);
  assert.deepStrictEqual(toasts, ["Spotify integration isn't available right now."]);
});

test("adaptive coach hint escalates after repeated low-accuracy loop reps", function() {
  sparkCore.performanceTracker = {
    getAccuracy: function() { return 0.5; }
  };
  sparkCore.processPlayAlongFrame = function() {
    return { timeMs: 4000, visibleNotes: [] };
  };
  S.playAlongLoop = true;
  S.playAlongLoopRange = { startMs: 3200, endMs: 5200 };
  S.playAlongLoopIteration = 3;

  sparkPlayAlongStartLoop();
  global._rafCallback();

  assert.ok(S.playAlongCoachHint.indexOf("multiple reps") >= 0);
});

test("section navigation advances and seeks to the next section", function() {
  var ok = sparkPlayAlongNextSection();

  assert.strictEqual(ok, true);
  assert.strictEqual(S.playAlongSectionIndex, 1);
  assert.strictEqual(S.playAlongCurrentSection, "Section: Chorus");
  assert.strictEqual(global._audioPlayedAt, 6);
});

test("section loop target follows selected section index", function() {
  S.playAlongLoopTarget = "section";
  S.playAlongSectionIndex = 1;

  var ok = sparkPlayAlongSetLoopTarget("section");

  assert.strictEqual(ok, true);
  assert.deepStrictEqual(S.playAlongLoopRange, { startMs: 6000, endMs: 9000 });
});

test("recent history can remove a single entry and clear all entries", function() {
  S.playAlongRecent = [
    { trackId: "a", params: { trackId: "a" } },
    { trackId: "b", params: { trackId: "b" } }
  ];

  assert.strictEqual(sparkPlayAlongRemoveRecent(0), true);
  assert.strictEqual(S.playAlongRecent.length, 1);
  assert.strictEqual(S.playAlongRecent[0].trackId, "b");

  assert.strictEqual(sparkPlayAlongClearRecent(), true);
  assert.deepStrictEqual(S.playAlongRecent, []);
});

test("bookmark current section stores replayable section entry", function() {
  sparkCore._activeParams = {
    trackId: "demo_song_1",
    title: "Sunrise Drive",
    instrument: "guitar"
  };
  S.playAlongSectionIndex = 1;

  var ok = sparkPlayAlongBookmarkCurrentSection();

  assert.strictEqual(ok, true);
  assert.ok(Array.isArray(S.playAlongBookmarks));
  assert.strictEqual(S.playAlongBookmarks[0].sectionLabel, "Chorus");
  assert.strictEqual(S.playAlongBookmarks[0].params.trackId, "demo_song_1");
});

test("launch bookmark restores section loop context", async function() {
  S.playAlongBookmarks = [{
    trackId: "demo_song_1",
    sectionIndex: 1,
    sectionLabel: "Chorus",
    params: {
      trackId: "demo_song_1",
      title: "Sunrise Drive",
      difficulty: "easy",
      instrument: "guitar"
    }
  }];

  var ok = sparkPlayAlongLaunchBookmark(0);
  await Promise.resolve();

  assert.strictEqual(ok, true);
  assert.strictEqual(S.playAlongSectionIndex, 1);
  assert.strictEqual(S.playAlongLoop, true);
  assert.strictEqual(S.playAlongLoopTarget, "section");
  assert.strictEqual(sparkCore.startedWith.trackId, "demo_song_1");
});

test("jump to weak section relaunches current session at stored section", async function() {
  sparkCore.lastSessionOutcome = {
    sectionSummary: {
      sectionIndex: 1,
      sectionLabel: "Chorus"
    }
  };
  sparkCore._activeParams = {
    trackId: "demo_song_1",
    title: "Sunrise Drive",
    difficulty: "easy",
    instrument: "guitar"
  };

  var ok = await sparkPlayAlongJumpToWeakSection();
  await Promise.resolve();

  assert.strictEqual(ok, true);
  assert.strictEqual(S.playAlongSectionIndex, 1);
  assert.strictEqual(S.playAlongLoop, true);
  assert.strictEqual(S.playAlongLoopTarget, "section");
  assert.strictEqual(sparkCore.startedWith.trackId, "demo_song_1");
});

test("jump to section recommendation resolves params from recent history", async function() {
  S.playAlongRecent = [{
    trackId: "demo_song_1",
    params: {
      trackId: "demo_song_1",
      title: "Sunrise Drive",
      difficulty: "easy",
      instrument: "guitar"
    }
  }];

  var ok = await sparkPlayAlongJumpToSectionRecommendation("demo_song_1", 1);
  await Promise.resolve();

  assert.strictEqual(ok, true);
  assert.strictEqual(S.playAlongSectionIndex, 1);
  assert.strictEqual(S.playAlongLoopTarget, "section");
  assert.strictEqual(sparkCore.startedWith.trackId, "demo_song_1");
});

test("bootstrapped handlers use render defined after controller load", function() {
  var renderCalls = 0;
  bootstrapWithoutRender();
  global.render = function() {
    renderCalls++;
  };

  sparkPlayAlongSetDifficulty("hard");

  assert.strictEqual(S.spotifyDifficulty, "hard");
  assert.strictEqual(renderCalls, 1);
});

test("search results markup routes buttons through shared actions", function() {
  var actionService = new SparkPlayAlongActionService(new SparkPlayAlongStateService());
  var markup = actionService.buildSearchResultsMarkup([{
    id: "track_1",
    name: "Track One",
    artist: "Artist"
  }]);

  assert.ok(markup.indexOf("onclick=\"act('playAlongSelect',0)\"") >= 0);
  assert.ok(markup.indexOf("event.stopPropagation();act('playAlongSaveTrack',0)") >= 0);
});

test("play along page routes search and file inputs through shared actions", function() {
  loadJS("js/pages/play_along.js");
  var markup = playAlongPage();

  assert.ok(markup.indexOf("oninput=\"act('playAlongSearch',this.value)\"") >= 0);
  assert.ok(markup.indexOf("onchange=\"act('playAlongLoadFile',this.files[0])\"") >= 0);
});

test("spotify prompt markup routes save through shared action", function() {
  var actionService = new SparkPlayAlongActionService(new SparkPlayAlongStateService());
  var markup = actionService.buildSpotifyClientIdPromptMarkup();

  assert.ok(markup.indexOf("onclick=\"act('playAlongSaveClientId')\"") >= 0);
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
