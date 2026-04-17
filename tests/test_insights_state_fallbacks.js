var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.S = {
    recommendationHistory: [{ source: "weakspot" }, { source: "weakspot" }, { source: "coach" }],
    performanceStats: {},
    personalInsights: {
      strongestSkills: [{ bucket: "songs", id: "demo_song", value: 0.9 }],
      weakestSkills: [{ bucket: "transitions", id: "G_C", value: 0.2 }],
      masteryTrend: { chords: [{ ts: 1, value: 0.5 }] },
      practiceTrend: { minutes: [{ ts: 1, value: 20 }] },
      recommendationQuality: { totalAccepted: 3 },
      careerTrend: { clearedSongs: 2, averageStars: 3.5, completedStages: 1 }
    },
    lastInsightRun: 123,
    playAlongRecent: [{ title: "Sunrise Drive" }],
    playAlongBookmarks: [{ sectionLabel: "Verse" }],
    practiceHistory: [{ id: 1 }, { id: 2 }],
    practiceStreak: 4,
    totalPracticeMinutes: 75,
    metaProgress: { challengesCompleted: 2, goalsCompleted: 1 },
    xp: 220,
    level: 6,
    insightSnapshots: [{
      ts: 10,
      mastery: { chords: 0.5, transitions: 0.4, rhythm: 0.3, songs: 0.2 },
      practice: { totalMinutes: 40, streak: 2, avgAccuracy: 81 }
    }],
    mastery: {
      chords: { C: 0.8 },
      transitions: { G_C: 0.2 }
    },
    careerProgress: {
      songRatings: {
        song_a: { bestStars: 3 },
        song_b: { bestStars: 1 }
      },
      stageCompletion: {
        stage_1: true,
        stage_2: false
      }
    }
  };
  global.__sparkState = null;
  global.SparkState = undefined;
  global.sparkCore = null;
  global.escHTML = function(value) { return String(value); };
  global.renderInsightLineChart = function() { return "<svg></svg>"; };
  global.getAverageAccuracy = function() { return 82; };
  global.getAveragePracticeMinutes = function() { return 37.5; };
  global.getRecentAccuracyTrend = function() { return 5; };
  global.buildCareerInsights = function() { return { clearedSongs: 2, averageStars: 3.5, completedStages: 1 }; };
  global.saveState = function() {};
}

async function test(name, fn) {
  try {
    resetState();
    await fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

console.log("\n--- Insights State Fallbacks ---");

async function run() {
  await test("insight helpers can read plain global S state", function() {
    eval(loadJS("js/insights/recommendations.js"));
    eval(loadJS("js/insights/practice.js"));
    eval(loadJS("js/insights/mastery.js"));
    eval(loadJS("js/insights/snapshots.js"));

    var recommendation = buildRecommendationInsights();
    var practice = buildPracticeInsights();
    var weakest = getWeakestMasterySkills(1);
    var snapshot = buildInsightSnapshot();

    assert.strictEqual(recommendation.totalAccepted, 3);
    assert.strictEqual(recommendation.bySource.weakspot, 2);
    assert.strictEqual(practice.currentStreak, 4);
    assert.strictEqual(practice.totalMinutes, 75);
    assert.strictEqual(weakest[0].id, "G_C");
    assert.strictEqual(snapshot.meta.xp, 220);
    assert.strictEqual(snapshot.meta.level, 6);
    assert.strictEqual(snapshot.career.clearedSongs, 1);
  });

  await test("generatePersonalInsights writes back through plain global S", function() {
    eval(loadJS("js/insights/recommendations.js"));
    eval(loadJS("js/insights/practice.js"));
    eval(loadJS("js/insights/mastery.js"));
    eval(loadJS("js/insights/engine.js"));

    var insights = generatePersonalInsights();

    assert.ok(insights);
    assert.ok(S.personalInsights);
    assert.ok(S.lastInsightRun);
    assert.strictEqual(S.personalInsights.recommendationQuality.totalAccepted, 3);
    assert.strictEqual(S.personalInsights.playAlongSummary.recentTitle, "Sunrise Drive");
  });

  await test("insights dashboard can render from plain global S", function() {
    eval(loadJS("js/insights/ui.js"));

    var html = insightsDashboardPage();

    assert.ok(html.indexOf("Personal Progress Insights") >= 0);
    assert.ok(html.indexOf("songs: demo_song") >= 0);
    assert.ok(html.indexOf("transitions: G_C") >= 0);
    assert.ok(html.indexOf("Total accepted: 3") >= 0);
    assert.ok(html.indexOf("Cleared songs: 2") >= 0);
  });

  await test("insight helpers fall back to global S when SparkState.getRoot returns null", function() {
    global.SparkState = { getRoot: function() { return null; } };
    eval(loadJS("js/insights/recommendations.js"));
    eval(loadJS("js/insights/practice.js"));
    eval(loadJS("js/insights/mastery.js"));
    eval(loadJS("js/insights/snapshots.js"));
    eval(loadJS("js/insights/engine.js"));

    assert.strictEqual(buildRecommendationInsights().totalAccepted, 3);
    assert.strictEqual(buildPracticeInsights().currentStreak, 4);
    assert.strictEqual(getWeakestMasterySkills(1)[0].id, "G_C");
    assert.strictEqual(buildInsightSnapshot().meta.level, 6);
    assert.ok(generatePersonalInsights());
  });

  await test("insights dashboard falls back to global S when SparkState.getRoot returns null", function() {
    global.SparkState = { getRoot: function() { return null; } };
    eval(loadJS("js/insights/ui.js"));

    var html = insightsDashboardPage();

    assert.ok(html.indexOf("Personal Progress Insights") >= 0);
    assert.ok(html.indexOf("songs: demo_song") >= 0);
  });

  if (failed) {
    process.exitCode = 1;
  } else {
    console.log("\n" + passed + " passed, 0 failed");
  }
}

run().catch(function(err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
