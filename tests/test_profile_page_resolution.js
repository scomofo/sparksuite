var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function test(name, fn) {
  try {
    resetEnvironment();
    global.eval(loadJS("js/showroom/spark-showroom.js"));
    fn();
    passed += 1;
    console.log("  PASS: " + name);
  } catch (error) {
    failed += 1;
    console.error("  FAIL: " + name);
    console.error("    " + error.message);
  }
}

function resetEnvironment() {
  global.window = global;
  global.S = {
    profile: {
      displayName: "Morgan",
      instrumentPrimary: "guitar"
    },
    sparkProfile: {
      displayName: "",
      instrumentPrimary: "guitar"
    },
    cloudProfile: {},
    playerXP: 0,
    playerLevel: 1,
    practiceStreak: 0,
    playerStats: {}
  };
  global.escHTML = function(value) { return String(value == null ? "" : value); };
  global.loadFlags = function() { return {}; };
  global.localStorage = {
    getItem: function() { return null; },
    setItem: function() {},
    removeItem: function() {}
  };
  global.SparkStorage = {
    load: function() {
      return {
        apps: {},
        suiteRewards: { badges: [], cosmetics: [], challengeProgress: {} }
      };
    }
  };
  global.SparkInstruments = {
    getActive: function() { return null; },
    getAll: function() {
      return [{
        id: "chordspark",
        instrument: "guitar",
        name: "Guitar"
      }];
    },
    openLauncherView: function() {}
  };
}

console.log("\n--- Profile Page Resolution ---");

test("profile screen uses real profile data and empty states instead of template defaults", function() {
  var html = SparkProfileScreen.render();

  assert.ok(html.indexOf("Morgan") >= 0);
  assert.strictEqual(html.indexOf("Alex Chen"), -1);
  assert.strictEqual(html.indexOf("Virtuoso"), -1);
  assert.strictEqual(html.indexOf("12,450"), -1);
  assert.strictEqual(html.indexOf("7-Day Spark"), -1);
  assert.ok(html.indexOf("No badges unlocked yet") >= 0);
  assert.ok(html.indexOf("0%") >= 0);
});

test("profile screen renders earned badges and real instrument progress", function() {
  global.SparkStorage.load = function() {
    return {
      displayName: "Riley",
      apps: {
        chordspark: {
          instrument: "guitar",
          stats: {
            xp: 320,
            level: 4,
            streakDays: 3,
            sessionsCompleted: 5,
            lessonsCompleted: 2,
            progressPct: 55
          }
        }
      },
      suiteRewards: {
        badges: ["first_session", "streak_3"],
        cosmetics: [],
        challengeProgress: {}
      }
    };
  };

  var html = SparkProfileScreen.render();

  assert.ok(html.indexOf("Riley") >= 0);
  assert.ok(html.indexOf("First Session") >= 0);
  assert.ok(html.indexOf("3-Day Streak") >= 0);
  assert.strictEqual(html.indexOf("Night Owl"), -1);
  assert.strictEqual(html.indexOf("Rhythm King"), -1);
  assert.ok(html.indexOf("55%") >= 0);
  assert.ok(html.indexOf("320") >= 0);
});

test("showroom empty states stay honest across song, leaderboard, session, and performance pages", function() {
  global.getPerformanceTopSongs = function() { return []; };
  global.SparkInstruments.getActive = function() {
    return {
      getData: function() {
        return {
          SONGS: [
            { id: "song_1", title: "Real Library Song", artist: "Catalog", bpm: 96, chords: ["C"] }
          ]
        };
      }
    };
  };

  var libraryHtml = SparkSongLibrary.render({ songs: [] });
  var detailsHtml = SparkSongDetails.render({});
  var leaderboardHtml = SparkLeaderboard.render({ entries: [] });
  var sessionHtml = SparkSessionSummary.render({});
  var performanceHtml = SparkPerformance.render({});

  assert.ok(libraryHtml.indexOf("No songs loaded for this instrument yet.") >= 0);
  assert.strictEqual(libraryHtml.indexOf("Neon Horizon"), -1);
  assert.ok(detailsHtml.indexOf("No song selected") >= 0);
  assert.strictEqual(detailsHtml.indexOf("Real Library Song"), -1);
  assert.ok(leaderboardHtml.indexOf("No scored runs yet.") >= 0);
  assert.strictEqual(leaderboardHtml.indexOf("Alex Chen"), -1);
  assert.ok(sessionHtml.indexOf("No completed session yet") >= 0);
  assert.strictEqual(sessionHtml.indexOf("Session Complete!"), -1);
  assert.strictEqual(sessionHtml.indexOf("Midnight Ember Jam"), -1);
  assert.ok(performanceHtml.indexOf("No performance loaded") >= 0);
  assert.strictEqual(performanceHtml.indexOf("S+"), -1);
});

test("showroom practice, lesson, and path shells do not invent progress or guitar lessons", function() {
  var practiceHtml = SparkPracticeMetro.render({});
  var lessonHtml = SparkLesson.render({});
  var pathHtml = SparkPath.render({});

  assert.ok(practiceHtml.indexOf("No practice focus yet.") >= 0);
  assert.ok(practiceHtml.indexOf("No drills loaded yet.") >= 0);
  assert.strictEqual(practiceHtml.indexOf(">45</span><span class=\"showroom-mini-unit\">min"), -1);
  assert.strictEqual(practiceHtml.indexOf(">92</span><span class=\"showroom-mini-unit\">/100"), -1);
  assert.strictEqual(practiceHtml.indexOf("+150 XP"), -1);

  assert.ok(lessonHtml.indexOf("No lesson loaded yet") >= 0);
  assert.ok(lessonHtml.indexOf("Choose a lesson from your path") >= 0);
  assert.ok(lessonHtml.indexOf("Open Path") >= 0);
  assert.strictEqual(lessonHtml.indexOf("G Major Foundation"), -1);
  assert.strictEqual(lessonHtml.indexOf("G Major Chord"), -1);
  assert.strictEqual(lessonHtml.indexOf("Module 01"), -1);

  assert.ok(pathHtml.indexOf("No lessons loaded yet") >= 0);
  assert.ok(pathHtml.indexOf("LEVEL 1") >= 0);
  assert.ok(pathHtml.indexOf("0% ACCURACY") >= 0);
  assert.strictEqual(pathHtml.indexOf("Chord Basics"), -1);
  assert.strictEqual(pathHtml.indexOf("Strumming Patterns"), -1);
  assert.strictEqual(pathHtml.indexOf("42" + String.fromCodePoint(0x1F525)), -1);
});

test("curriculum dashboard and syllabus use real lesson data instead of sample modules", function() {
  global.S.guidedSession = 2;
  global.S.completedGuidedSessions = [1];

  global.SparkInstruments = {
    getActive: function() {
      return {
        id: "pianospark",
        appId: "pianospark",
        instrument: "piano",
        name: "Piano",
        getData: function() {
          return {
            SESSIONS: [
              { num: 1, title: "First Keys" },
              { num: 2, title: "Chord Shapes" },
              { num: 3, title: "Pedal Flow" }
            ]
          };
        }
      };
    },
    getAll: function() {
      return [{
        id: "pianospark",
        appId: "pianospark",
        instrument: "piano",
        name: "Piano"
      }];
    },
    openLauncherView: function() {}
  };

  var dashboardHtml = SparkCurriculumDashboard.render();
  var syllabusHtml = SparkCourseSyllabus.render();

  assert.ok(dashboardHtml.indexOf("Piano Path") >= 0);
  assert.ok(dashboardHtml.indexOf("First Keys") >= 0);
  assert.ok(dashboardHtml.indexOf("Chord Shapes") >= 0);
  assert.strictEqual(dashboardHtml.indexOf("Guitar Fundamentals"), -1);
  assert.strictEqual(dashboardHtml.indexOf("Module 1: Getting Started"), -1);

  assert.ok(syllabusHtml.indexOf("Piano Path") >= 0);
  assert.ok(syllabusHtml.indexOf("Pedal Flow") >= 0);
  assert.strictEqual(syllabusHtml.indexOf("Guitar Fundamentals"), -1);
  assert.strictEqual(syllabusHtml.indexOf("Module 1: Getting Started"), -1);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
