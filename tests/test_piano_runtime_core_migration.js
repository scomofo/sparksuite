var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    resetState();
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

function resetState() {
  global.window = global;
  global.document = {
    body: {
      classList: {
        toggle: function() {}
      }
    },
    addEventListener: function() {},
    getElementById: function() { return null; }
  };
  global.prompt = function() { return ""; };
  global.SparkSessionTypes = {
    FLOW_GUIDED_SESSION: "guided_session",
    FLOW_PERFORMANCE_SONG: "performance_song"
  };
  global.S = {
    currentSession: 2,
    guidedSession: 2,
    completedSessions: [],
    chordProg: {},
    level: 1,
    lhLevel: 1,
    bpm: 72,
    sessionPlan: null,
    sessionStep: null,
    screen: "home",
    fingerWarmUpDone: false,
    paused: false,
    performDifficulty: "normal",
    performArrangementType: "block_chords",
    performSongData: null,
    performSongId: ""
  };
  global.PIANO_DATA = {
    CURRICULUM: [{ num: 1, title: "First Steps", sessions: "1-3", lhPattern: "R1" }],
    LH_PATTERNS: [{ id: "R1" }],
    BADGES: []
  };
  global.PIANO_CURRICULUM = global.PIANO_DATA.CURRICULUM;
  global.PIANO_SESSIONS = [
    { num: 1, title: "Session 1", bpm: 70, spark: { text: "start" }, newMove: { chord: "C" } },
    { num: 2, title: "Session 2", bpm: 84, spark: { text: "next" }, newMove: { chord: "G" } }
  ];
  global.PIANO_SONGS = [];
  global.PIANO_DATA.SONGS = [
    { title: "Midnight Train", artist: "Piano Suite", bpm: 72, chords: ["C", "G"], progression: ["C", "G"], style: "block" },
    { title: "River Walk", artist: "Piano Suite", bpm: 88, chords: ["F", "Am"], progression: ["F", "Am", "F"], style: "block" }
  ];
  global.PIANO_SONGS = global.PIANO_DATA.SONGS;
  global.PIANO_DATA.FINGER_EXERCISES = [];
  global.PIANO_DATA.LC = {};
  global.PIANO_DATA.LN = {};
  global.PIANO_DATA.CHORDS = {};
  global.PIANO_DATA.SCALES = [];
  global.PIANO_DATA.FINGER_BADGES = [];
  global.PIANO_DATA.DAILY_TYPES = [];
  global.PIANO_DATA.PLAY_STYLES = [];
  global.PIANO_DATA.REWARD_PHASES = [];
  global.PIANO_DATA.CHORD_COLORS = {};

  global.saveStateCalls = 0;
  global.renderCalls = 0;
  global.practiceDateChecks = 0;
  global.levelChecks = 0;
  global.confettiCalls = 0;
  global.toasts = [];
  global.playedSounds = [];
  global.sparkCoreCalls = [];
  global.performanceStarts = [];
  global.performanceNavigationCalls = [];
  global.songRuntimeCalls = [];
  global.dashboardNavigationCalls = [];
  global.dashboardRequestCalls = [];
  global.dashboardChallengeRewardCalls = [];

  global.saveState = function() { saveStateCalls++; };
  global.render = function() { renderCalls++; };
  global.showToast = function(msg) { toasts.push(msg); };
  global.checkPracticeDate = function() { practiceDateChecks++; };
  global.checkLevelUp = function() { levelChecks++; };
  global.pianoCheckBadges = function() { return []; };
  global.pianoShowConfetti = function() { confettiCalls++; };
  global.stopMetronome = function() {};
  global.stopLHPattern = function() {};
  global.stopWatchDemo = function() {};
  global.stopDetection = function() {};
  global.addPracticeSecond = function() {};
  global.applyPerformanceDifficultyToState = function(value) { S.performDifficulty = value || "normal"; };
  global.normalizeSongId = function(song) {
    var title = song && song.title ? song.title : "";
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  };
  global.buildPerformanceChartFromSong = function(song, arrangementType) {
    return {
      id: (song && song.title ? song.title.toLowerCase().replace(/[^a-z0-9]+/g, "_") : "generated"),
      title: song && song.title ? song.title : "Generated",
      arrangementType: arrangementType || "block_chords",
      events: [{ id: 1, t: 0, dur: 1, laneLabel: "C" }]
    };
  };
  global.startPerformance = function(chart, options) {
    performanceStarts.push({ chart: chart, options: options });
  };
  global.stopPerformance = function() {};
  global.clickableDiv = function() {};
  global.ifThenCard = function() {};
  global.fireMicro = function() {};
  global.escHTML = function(v) { return String(v); };
  global.getRewardPhase = function() { return null; };
  global.allChordKeys = function() { return []; };
  global.allChords = function() { return []; };
  global.findChord = function() { return null; };
  global.chordsForLevel = function() { return []; };
  global.chordsUpToLevel = function() { return []; };
  global.chordMidi = function() { return []; };
  global.chordFingers = function() { return []; };
  global.chordNoteNames = function() { return []; };
  global.getAvailableExercises = function() { return []; };
  global.getSessionExercise = function() { return null; };
  global.getWarmUpExercise = function() { return null; };
  global.resetProgress = function() {};
  global.undoReset = function() {};
  global.startOnboarding = function() {};
  global.continueOnboarding = function() {};
  global.PerformanceTransport = { now: function() { return 0; } };
  global.PerformanceInput = { heldMidiNotes: {}, recentMidiNoteOns: [], latestPitchClasses: [] };
  global.PianoAudio = {
    playSound: function(name) { playedSounds.push(name); }
  };
  global.T = {};
  global.metronomeInterval = null;

  global.sparkCore = {
    startSession: function(payload) {
      sparkCoreCalls.push({ fn: "startSession", payload: payload });
      if (payload.flow === "performance_song") {
        return {
          context: {
            performanceSong: {
              songData: global.PIANO_DATA.SONGS[payload.songIndex],
              songId: "river_walk",
              arrangementType: payload.arrangementType,
              difficultyId: payload.difficultyId
            }
          }
        };
      }
      return {
        context: {
          guidedSession: 2,
          guidedPlan: {
            num: 2,
            title: "Session 2",
            bpm: 84,
            spark: { text: "next" },
            newMove: { chord: "G" }
          }
        }
      };
    },
    completeSession: function(payload) {
      sparkCoreCalls.push({ fn: "completeSession", payload: payload });
      return {
        audioCue: "levelup",
        sessionStatePatch: {
          guided: {
            completedSessionNums: [2],
            nextGuidedSession: 3,
            chordProgress: { G: 25 }
          }
        }
      };
    }
  };
  global.sparkCore.openGuidedSession = function(payload) {
    sparkCoreCalls.push({ fn: "openGuidedSession", payload: payload });
    return {
      context: {
        guidedSession: 2,
        guidedPlan: {
          num: 2,
          title: "Session 2",
          bpm: 84,
          spark: { text: "next" },
          newMove: { chord: "G" }
        }
      }
    };
  };
  global.sparkCore.completeGuidedSession = function(payload) {
    sparkCoreCalls.push({ fn: "completeGuidedSession", payload: payload || {} });
    return {
      audioCue: "levelup",
      sessionStatePatch: {
        guided: {
          completedSessionNums: [2],
          nextGuidedSession: 3,
          chordProgress: { G: 25 }
        }
      }
    };
  };
  global.sparkCore.getActiveSessionView = function() {
    return {
      plan: {
        context: {
          performanceSong: {
            songData: global.PIANO_DATA.SONGS[1],
            songId: "river_walk",
            arrangementType: "block_chords",
            difficultyId: "normal"
          }
        }
      }
    };
  };
  global.sparkCore.openPerformanceSongSelection = function(payload) {
    sparkCoreCalls.push({ fn: "openPerformanceSongSelection", payload: payload });
    return payload;
  };
  global.sparkCore.openDashboardPracticePlan = function(payload) {
    sparkCoreCalls.push({ fn: "openDashboardPracticePlan", payload: payload || {} });
    return payload || {};
  };
  global.sparkCore.openCareerSongSelection = function(payload) {
    sparkCoreCalls.push({ fn: "openCareerSongSelection", payload: payload });
    return payload;
  };
  global.sparkCore.startSelectedPerformanceSong = function(payload) {
    sparkCoreCalls.push({ fn: "startSelectedPerformanceSong", payload: payload });
    return payload;
  };
  global.sparkCore.syncPerformanceRuntimeState = function(action, payload) {
    sparkCoreCalls.push({ fn: "syncPerformanceRuntimeState", action: action, payload: payload });
    return payload;
  };
  global.sparkCore.applyPerformanceNavigationRequest = function(target) {
    performanceNavigationCalls.push(target);
    return { activeScreen: "home", activeTab: "songs" };
  };
  global.openPerformanceSongSelectionRequest = function(payload) {
    return global.sparkCore.openPerformanceSongSelection(payload);
  };
  global.openDashboardPracticePlanRequest = function(payload) {
    return global.sparkCore.openDashboardPracticePlan(payload);
  };
  global.openCareerSongSelectionRequest = function(payload) {
    return global.sparkCore.openCareerSongSelection(payload);
  };
  global.openGuidedSessionRequest = function(payload) {
    return global.sparkCore.openGuidedSession(payload);
  };
  global.completeGuidedSessionRequest = function(payload) {
    return global.sparkCore.completeGuidedSession(payload);
  };
  global.startSelectedPerformanceSongRequest = function(payload) {
    return global.sparkCore.startSelectedPerformanceSong(payload);
  };
  global.applyPerformanceNavigationRequest = function(target) {
    return global.sparkCore.applyPerformanceNavigationRequest(target);
  };
  global.openSongSessionRequest = function(payload) {
    songRuntimeCalls.push({ fn: "openSongSessionRequest", payload: payload });
    return payload;
  };
  global.syncSongRuntimeRequest = function(action, payload) {
    songRuntimeCalls.push({ fn: "syncSongRuntimeRequest", action: action, payload: payload });
    return payload;
  };
  global.applySongNavigationRequest = function(target, payload) {
    songRuntimeCalls.push({ fn: "applySongNavigationRequest", target: target, payload: payload || {} });
    return { activeScreen: "home", activeTab: "songs" };
  };
  global.applyDashboardNavigationRequest = function(target) {
    dashboardNavigationCalls.push(target);
    return { activeScreen: target };
  };
  global.applyDashboardRequest = function(payload) {
    dashboardRequestCalls.push(payload);
    return payload;
  };
  global.applyDashboardChallengeRewardRequest = function(challengeId) {
    dashboardChallengeRewardCalls.push(challengeId);
    return { challengeId: challengeId };
  };
  global.generateRecommendations = function() {
    S.recommendations = [{ id: "rec_1", title: "Practice River Walk" }];
    return S.recommendations;
  };
  global.generatePersonalInsights = function() {
    S.personalInsights = { strongestSkills: [{ id: "timing" }] };
    return S.personalInsights;
  };
  global.initializeChallengesForCurrentCycle = function() {
    S.activeChallenges = [{ id: "daily_1", title: "Daily Challenge" }];
    return S.activeChallenges;
  };
  global.getPerformanceRetryRequest = function(payload) {
    sparkCoreCalls.push({ fn: "getPerformanceRetryRequest", payload: payload });
    return payload;
  };
}

resetState();
eval(loadJS("js/instruments/piano/app.js"));

console.log("\n--- Piano Runtime Core Migration ---");

test("start_guided_session delegates to sparkCore and syncs piano session aliases", function() {
  pianoAct("start_guided_session");

  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "openGuidedSession");
  assert.strictEqual(S.currentSession, 2);
  assert.strictEqual(S.sessionPlan.title, "Session 2");
  assert.strictEqual(S.sessionStep, "spark");
  assert.strictEqual(S.screen, "session");
  assert.strictEqual(S.adaptiveBpm, 84);
});

test("complete_victory_lap delegates to sparkCore and syncs piano completion aliases", function() {
  S.sessionPlan = {
    num: 2,
    title: "Session 2",
    bpm: 84,
    newMove: { chord: "G" }
  };
  S.sessionStep = "victoryLap";
  S.screen = "session";

  pianoAct("complete_victory_lap");

  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "completeGuidedSession");
  assert.deepStrictEqual(S.completedSessions, [2]);
  assert.strictEqual(S.currentSession, 3);
  assert.strictEqual(S.guidedSession, 3);
  assert.strictEqual(S.chordProg.G, 25);
  assert.strictEqual(S.screen, "home");
  assert.strictEqual(S.sessionPlan, null);
  assert.ok(playedSounds.indexOf("levelup") >= 0);
  assert.strictEqual(confettiCalls, 1);
});

test("open_perform_song delegates to sparkCore and syncs piano performance aliases", function() {
  pianoAct("open_perform_song", "1");

  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "openPerformanceSongSelection");
  assert.strictEqual(sparkCoreCalls[0].payload.songIndex, 1);
  assert.strictEqual(S.performSongData.title, "River Walk");
  assert.strictEqual(S.performSongId, "river_walk");
  assert.strictEqual(S.performArrangementType, "block_chords");
  assert.strictEqual(S.performDifficulty, "normal");
  assert.strictEqual(S.screen, "performSong");
});

test("openPlan delegates piano dashboard practice entry to the shared helper", function() {
  pianoAct("openPlan");

  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "openDashboardPracticePlan");
  assert.strictEqual(S.screen, "practicePlan");
});

test("openCareerSong delegates to shared performance selection helper and syncs piano aliases", function() {
  global.getCareerItem = function(type, id) {
    if (type !== "songs" || id !== "career_river") return null;
    return { title: "Career River", artist: "Piano Suite", bpm: 76, chords: ["C"], progression: ["C", "G"] };
  };

  pianoAct("openCareerSong", "career_river");

  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "openCareerSongSelection");
  assert.strictEqual(sparkCoreCalls[0].payload.songId, "career_river");
  assert.strictEqual(sparkCoreCalls[0].payload.songData.title, "Career River");
  assert.strictEqual(S.performSongData.title, "Career River");
  assert.strictEqual(S.performSongId, "career_river");
  assert.strictEqual(S.screen, "performSong");
});

test("performStart delegates launch request construction to sparkCore helpers", function() {
  S.performSongData = { title: "River Walk", artist: "Piano Suite" };
  S.performArrangementType = "block_chords";
  S.performDifficulty = "hard";
  S.performSpeed = 0.8;
  S.performMode = "mic";

  pianoAct("performStart");

  assert.strictEqual(sparkCoreCalls.length, 1);
  assert.strictEqual(sparkCoreCalls[0].fn, "startSelectedPerformanceSong");
  assert.strictEqual(sparkCoreCalls[0].payload.difficulty, "hard");
  assert.strictEqual(sparkCoreCalls[0].payload.speed, 0.8);
  assert.strictEqual(performanceStarts.length, 1);
  assert.strictEqual(performanceStarts[0].options.difficulty, "hard");
  assert.strictEqual(performanceStarts[0].options.speed, 0.8);
  assert.strictEqual(performanceStarts[0].options.mode, "mic");
});

test("select_song mirrors piano song detail selection into song-session core helpers", function() {
  pianoAct("select_song", "1");

  assert.strictEqual(S.songIdx, 1);
  assert.strictEqual(S.songChordIdx, 0);
  assert.strictEqual(S.songPlaying, false);
  assert.strictEqual(S.bpm, global.PIANO_DATA.SONGS[1].bpm);
  assert.strictEqual(songRuntimeCalls.length, 1);
  assert.strictEqual(songRuntimeCalls[0].fn, "openSongSessionRequest");
  assert.strictEqual(songRuntimeCalls[0].payload.songData.title, "River Walk");
  assert.strictEqual(songRuntimeCalls[0].payload.source, "builtin");
});

test("play_song mirrors piano song playback state into song-session core helpers", function() {
  S.songIdx = 1;
  S.songChordIdx = 0;
  S.bpm = 88;

  pianoAct("play_song");

  assert.strictEqual(S.songPlaying, true);
  assert.strictEqual(songRuntimeCalls.length, 1);
  assert.strictEqual(songRuntimeCalls[0].fn, "syncSongRuntimeRequest");
  assert.strictEqual(songRuntimeCalls[0].action, "play");
  assert.strictEqual(songRuntimeCalls[0].payload.songData.title, "River Walk");

  pianoAct("play_song");

  assert.strictEqual(S.songPlaying, false);
  assert.strictEqual(songRuntimeCalls.length, 2);
  assert.strictEqual(songRuntimeCalls[1].fn, "syncSongRuntimeRequest");
  assert.strictEqual(songRuntimeCalls[1].action, "pause");
});

test("song_back mirrors piano song exit into song-session navigation helper", function() {
  S.songIdx = 1;
  S.songPlaying = true;
  T.song = 42;

  pianoAct("song_back");

  assert.strictEqual(S.songIdx, null);
  assert.strictEqual(S.songPlaying, false);
  assert.strictEqual(songRuntimeCalls.length, 1);
  assert.strictEqual(songRuntimeCalls[0].fn, "applySongNavigationRequest");
  assert.strictEqual(songRuntimeCalls[0].target, "songs_home");
});

test("dashboard entry actions mirror piano navigation into shared dashboard helpers", function() {
  pianoAct("openRecommendations");
  pianoAct("openInsights");
  pianoAct("openChallengeHub");
  pianoAct("openHomeDash");

  assert.deepStrictEqual(dashboardNavigationCalls, ["recommendations", "insights", "challenges", "home_dash"]);
  assert.strictEqual(S.screen, "homeDash");
});

test("refreshHome mirrors piano dashboard snapshots into shared helper", function() {
  S.activeChallenges = [{ id: "daily_1", title: "Daily Challenge" }];

  pianoAct("refreshHome");

  assert.strictEqual(dashboardRequestCalls.length, 1);
  assert.strictEqual(dashboardRequestCalls[0].recommendations[0].id, "rec_1");
  assert.strictEqual(dashboardRequestCalls[0].insights.strongestSkills[0].id, "timing");
  assert.strictEqual(dashboardRequestCalls[0].challenges[0].id, "daily_1");
});

test("claimChallengeReward mirrors piano challenge claims into shared dashboard helper", function() {
  global.claimedChallengeIds = [];
  global.claimChallengeReward = function(id) {
    claimedChallengeIds.push(id);
  };

  pianoAct("claimChallengeReward", "daily_1");

  assert.deepStrictEqual(claimedChallengeIds, ["daily_1"]);
  assert.deepStrictEqual(dashboardChallengeRewardCalls, ["daily_1"]);
});

test("go_home returns piano dashboard-family screens through shared dashboard back helper", function() {
  S.screen = "recommendations";

  pianoAct("go_home");

  assert.deepStrictEqual(dashboardNavigationCalls, ["dashboard_back"]);
  assert.strictEqual(S.screen, "homeDash");
});

console.log("\nPassed: " + passed + "  Failed: " + failed);
if (failed > 0) process.exit(1);
