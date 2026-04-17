var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetBaseState() {
  global.window = global;
  global.S = {
    transitionStats: {
      "G->C": { attempts: 4, clean: 1, avgMs: 950 }
    },
    performanceStats: {
      song_alpha: {
        rhythm_chords: {
          normal: { avgAccuracy: 62, mastered: false }
        }
      }
    },
    streak: 5,
    level: 9,
    history: [{ id: 1 }, { id: 2 }],
    rhythmResults: { accuracy: 87 },
    sessions: 12,
    totalPracticeMinutes: 55,
    practiceHistory: [{ minutes: 10 }, { minutes: 20 }],
    practiceStreak: 3,
    playerStats: {
      songsCompleted: 4,
      streakBest: 7
    },
    analytics: {
      accuracyHistory: [{ accuracy: 70 }, { accuracy: 90 }],
      practiceHistory: [{ minutes: 10 }, { minutes: 20 }],
      xpHistory: [{ xp: 20 }, { xp: 45 }]
    }
  };
  global.__sparkState = null;
  global.SparkState = undefined;
  global.createAnalyticsSummaryShell = function() {
    return {
      weakestTransitions: [],
      weakestSongs: [],
      weakestPhrases: [],
      strongestSkills: [],
      recentImprovement: [],
      practiceConsistency: {},
      recommendations: []
    };
  };
  global.selectWeakTransitionCandidate = null;
  global.selectWeakPerformanceCandidate = null;
  global.selectRhythmCandidate = null;
  global.selectFingerCandidate = null;
  global.saveState = function() {};
}

function test(name, fn) {
  try {
    resetBaseState();
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

console.log("\n--- Analytics State Fallbacks ---");

test("analytics engine can build a summary from plain global S", function() {
  eval(loadJS("js/analytics/engine.js"));

  var summary = buildAnalyticsSummary();

  assert.strictEqual(summary.weakestTransitions.length, 1);
  assert.strictEqual(summary.weakestTransitions[0].label, "G \u2192 C");
  assert.strictEqual(summary.weakestSongs[0].songId, "song_alpha");
  assert.strictEqual(summary.practiceConsistency.sessions, 12);
  assert.strictEqual(summary.strongestSkills[0].label, "Practice streak");
});

test("analytics reports can read shared progress from plain global S", function() {
  global.getAverageAccuracy = function() { return 88; };
  eval(loadJS("js/analytics/reports.js"));

  var practiceReport = generatePracticeReport();
  var performanceReport = generatePerformanceReport();

  assert.strictEqual(practiceReport.level, 9);
  assert.strictEqual(practiceReport.sessions, 2);
  assert.strictEqual(performanceReport.songsPlayed, 4);
  assert.strictEqual(performanceReport.bestStreak, 7);
});

test("analytics stats write nested history into plain global S", function() {
  eval(loadJS("js/analytics/stats.js"));

  recordPerformanceStats({ accuracy: 81, score: 900, songId: "song_beta", arrangementType: "block_chords" });
  recordPracticeStats(15);
  recordXPStats(30);
  recordStreakStats(6);

  assert.strictEqual(Array.isArray(S.analytics.performanceHistory), true);
  assert.strictEqual(S.analytics.performanceHistory.length, 1);
  assert.strictEqual(S.analytics.performanceHistory[0].songId, "song_beta");
  assert.strictEqual(S.analytics.performanceHistory[0].arrangementType, "block_chords");
  assert.strictEqual(S.analytics.practiceHistory[S.analytics.practiceHistory.length - 1].minutes, 15);
  assert.strictEqual(S.analytics.xpHistory[S.analytics.xpHistory.length - 1].xp, 30);
  assert.strictEqual(S.analytics.streakHistory[S.analytics.streakHistory.length - 1].streak, 6);
  assert.strictEqual(S["analytics,performanceHistory"], undefined);
});

test("analytics trends can read nested analytics history from plain global S", function() {
  eval(loadJS("js/analytics/trends.js"));

  assert.strictEqual(getAverageAccuracy(), 80);
  assert.strictEqual(getAveragePracticeMinutes(), 15);
  assert.strictEqual(getRecentAccuracyTrend(), 20);
  assert.strictEqual(getXPTrend(), 25);
});

test("core analytics can record performances into plain global S", function() {
  eval(loadJS("js/core/analytics.js"));

  recordPerformanceAnalytics({ accuracy: 92, songId: "song_gamma" });

  assert.strictEqual(S.analytics.performances.length, 1);
  assert.strictEqual(S.analytics.performances[0].songId, "song_gamma");
  assert.strictEqual(getAverageAccuracy(), 92);
});

test("analytics helpers fall back to global S when SparkState.getRoot returns null", function() {
  global.SparkState = { getRoot: function() { return null; } };
  global.getAverageAccuracy = function() { return 88; };
  eval(loadJS("js/analytics/engine.js"));
  eval(loadJS("js/analytics/reports.js"));
  eval(loadJS("js/analytics/stats.js"));
  eval(loadJS("js/analytics/trends.js"));
  eval(loadJS("js/core/analytics.js"));

  assert.strictEqual(buildAnalyticsSummary().practiceConsistency.sessions, 12);
  assert.strictEqual(generatePracticeReport().level, 9);
  recordPerformanceStats({ accuracy: 81, score: 900, songId: "song_beta", arrangementType: "block_chords" });
  assert.strictEqual(Array.isArray(S.analytics.performanceHistory), true);
  assert.strictEqual(getAveragePracticeMinutes(), 15);
  recordPerformanceAnalytics({ accuracy: 92, songId: "song_gamma" });
  assert.strictEqual(S.analytics.performances[S.analytics.performances.length - 1].songId, "song_gamma");
});

if (failed) {
  process.exitCode = 1;
} else {
  console.log("\n" + passed + " passed, 0 failed");
}
