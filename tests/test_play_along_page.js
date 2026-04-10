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
    playAlongPaused: false,
    playAlongLoop: true,
    playAlongLoopTarget: "drill",
    playAlongLoopRange: { startMs: 3200, endMs: 5200 },
    playAlongSpeed: "0.75",
    playAlongLoopIteration: 1,
    playAlongLoopProgress: 0,
    playAlongCoachHint: "Stay in the loop and clean up the timing before speeding up.",
    playAlongCurrentSection: "Section: Verse",
    playAlongNowMs: 4321,
    playAlongSelectedDrill: {
      label: "Fix timing",
      repetitions: 4
    },
    playAlongRecent: [{
      trackId: "demo_song_1",
      title: "Sunrise Drive",
      artist: "SparkSuite Demo",
      difficulty: "easy",
      transportMode: "generated",
      params: { trackId: "demo_song_1" }
    }],
    playAlongBookmarks: [{
      trackId: "demo_song_1",
      title: "Sunrise Drive",
      sectionLabel: "Chorus",
      startMs: 4000,
      params: { trackId: "demo_song_1" }
    }]
  };
  global.sparkCore = {
    _activeChart: {
      trackId: "track_1",
      sections: [
        { name: "Verse", startMs: 0, endMs: 4000 },
        { name: "Chorus", startMs: 4000, endMs: 8000 }
      ],
      getBpm: function() { return 128; }
    },
    runtimeState: {
      playAlongTransportMode: "spotify"
    },
    performanceTracker: {
      getAccuracy: function() { return 0.83; }
    }
  };
}

function bootstrap() {
  resetState();
  loadJS("js/pages/play_along.js");
}

console.log("=== Play Along Page Tests ===");

test("playAlongSessionPage shows active drill and loop window", function() {
  var html = playAlongSessionPage();

  assert.ok(html.indexOf("Target: Drill") >= 0);
  assert.ok(html.indexOf("Active Drill: Fix timing") >= 0);
  assert.ok(html.indexOf("Loop Window: 0:03 - 0:05") >= 0);
  assert.ok(html.indexOf("Rep 1 / 4") >= 0);
  assert.ok(html.indexOf("Loop Progress: 0%") >= 0);
  assert.ok(html.indexOf("Stay in the loop and clean up the timing before speeding up.") >= 0);
  assert.ok(html.indexOf("Speed: 0.75x") >= 0);
  assert.ok(html.indexOf("83%") >= 0);
  assert.ok(html.indexOf("Transport: spotify") >= 0);
  assert.ok(html.indexOf("Loop Target: drill") >= 0);
  assert.ok(html.indexOf("Section: Verse") >= 0);
  assert.ok(html.indexOf("Position:") >= 0);
  assert.ok(html.indexOf("0:04") >= 0);
  assert.ok(html.indexOf("Prev Section") >= 0);
  assert.ok(html.indexOf("Next Section") >= 0);
  assert.ok(html.indexOf("Section 1 of 2: Verse") >= 0);
  assert.ok(html.indexOf("Save This Section") >= 0);
});

test("playAlongSessionPage escapes drill labels", function() {
  S.playAlongSelectedDrill = {
    label: "<Timing & Focus>",
    repetitions: 2
  };

  var html = playAlongSessionPage();

  assert.ok(html.indexOf("&lt;Timing &amp; Focus&gt;") >= 0);
});

test("playAlongResultsPage shows drill completion summary", function() {
  sparkCore.lastSessionOutcome = {
    accuracy: 0.82,
    timing: 0.76,
    consistency: 0.71,
    feedback: [],
    drills: [],
    performance: {
      weakAreas: ["lane_2", "late"]
    },
    sectionSummary: {
      sectionLabel: "Verse"
    },
    drillSummary: {
      label: "Fix timing",
      completedReps: 4,
      targetReps: 4,
      metTarget: true,
      loopWindowLabel: "0:03 - 0:05"
    }
  };

  var html = playAlongResultsPage();

  assert.ok(html.indexOf("Drill Summary") >= 0);
  assert.ok(html.indexOf("Completed 4 of 4 reps") >= 0);
  assert.ok(html.indexOf("Loop Window: 0:03 - 0:05") >= 0);
  assert.ok(html.indexOf("Target reached") >= 0);
  assert.ok(html.indexOf("Back to Full Song") >= 0);
  assert.ok(html.indexOf("Next Best Move") >= 0);
  assert.ok(html.indexOf("Where It Broke Down") >= 0);
  assert.ok(html.indexOf("Lane 3") >= 0);
  assert.ok(html.indexOf("late") >= 0);
  assert.ok(html.indexOf("Weak section: Verse") >= 0);
  assert.ok(html.indexOf("Jump To Weak Section") >= 0);
  assert.ok(html.indexOf("Save Weak Section") >= 0);
});

test("playAlongPage shows featured demo songs", function() {
  var html = playAlongPage();

  assert.ok(html.indexOf("Featured Songs") >= 0);
  assert.ok(html.indexOf("Sunrise Drive") >= 0);
  assert.ok(html.indexOf("Midnight Echo") >= 0);
});

test("playAlongPage shows recent songs", function() {
  var html = playAlongPage();

  assert.ok(html.indexOf("Recent Songs") >= 0);
  assert.ok(html.indexOf("Replay") >= 0);
  assert.ok(html.indexOf("Remove") >= 0);
  assert.ok(html.indexOf("Clear History") >= 0);
  assert.ok(html.indexOf("generated") >= 0);
  assert.ok(html.indexOf("Saved Sections") >= 0);
  assert.ok(html.indexOf("Jump In") >= 0);
  assert.ok(html.indexOf("Clear Bookmarks") >= 0);
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
