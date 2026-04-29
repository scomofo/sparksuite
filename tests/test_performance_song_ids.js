var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

global.window = global;
global.SparkContent = {
  songs: {
    stand_by_me: { id: "stand_by_me", title: "Stand By Me", artist: "Ben E. King" },
    let_it_be: { id: "let_it_be", title: "Let It Be", artist: "The Beatles" }
  }
};
global.SparkInstruments = {
  getActive: function() {
    return { id: "chordspark", appId: "chordspark", instrument: "guitar" };
  },
  getAll: function() {
    return [
      { id: "chordspark", appId: "chordspark", instrument: "guitar" }
    ];
  }
};
global.SessionPlan = function SessionPlan(input) {
  Object.assign(this, input);
};
global.SparkSessionTypes = {
  FLOW_PERFORMANCE_SONG: "performance_song"
};

global.eval(loadJS("js/performance/adapters.js"));
global.eval(loadJS("js/sparksuite/core/session_engine.js"));
global.eval(loadJS("js/sparksuite/bridges/performance_bridge.js"));

console.log("=== Performance Song Id Tests ===");

test("resolvePerformanceSongId prefers explicit ids", function() {
  assert.strictEqual(resolvePerformanceSongId({ id: "Stand_By_Me" }), "stand_by_me");
  assert.strictEqual(resolvePerformanceSongId({ songId: "Let It Be" }), "let_it_be");
});

test("resolvePerformanceSongId falls back to canonical content matches", function() {
  assert.strictEqual(
    resolvePerformanceSongId({ title: "Stand By Me", artist: "Ben E. King" }),
    "stand_by_me"
  );
});

test("buildPerformanceSongFromBuiltin uses canonical ids for overlapping songs", function() {
  var song = buildPerformanceSongFromBuiltin({
    title: "Let It Be",
    artist: "The Beatles",
    progression: ["C", "G", "Am", "F"]
  });

  assert.strictEqual(song.id, "let_it_be");
});

test("session engine uses canonical song ids when selecting performance songs", function() {
  var engine = new SparkSuiteSessionEngine({}, {});
  var plan = engine.buildPerformanceSongSession({
    songId: "stand_by_me",
    instrumentContext: {
      appId: "chordspark",
      instrumentType: "guitar",
      songs: [
        { title: "Stand By Me", artist: "Ben E. King", progression: ["G", "Em", "C", "D"] }
      ]
    }
  });

  assert.strictEqual(plan.lesson.id, "stand_by_me");
  assert.strictEqual(plan.context.performanceSong.songId, "stand_by_me");
});

test("legacy performance follow-ons count canonically-resolved songs toward all songs badge", function() {
  global.S = {
    earnedBadges: [],
    newBadge: null,
    performanceStats: {
      stand_by_me_chords_normal: { runs: 1 }
    },
    performanceDailyComplete: false,
    performanceDailyHistory: []
  };
  global.SONGS = [
    { title: "Stand By Me", artist: "Ben E. King", progression: ["G", "Em", "C", "D"] }
  ];
  global.BADGES = [
    { id: "perf_first", name: "First Song" },
    { id: "perf_allsongs", name: "All Songs" }
  ];

  var result = SparkPerformanceBridge.applyPerformanceRunFollowOns({
    chartId: "stand_by_me",
    chart: { arrangementType: "chords" },
    difficulty: "normal",
    results: { totalEvents: 16, stars: 3, accuracy: 88 }
  });

  assert.ok(result.builtInBadges.indexOf("perf_allsongs") >= 0);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
