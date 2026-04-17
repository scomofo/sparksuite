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
    activeCareerId: "career_main",
    careerProgress: {
      unlockedTiers: {},
      unlockedStages: { stage_one: true },
      unlockedSongs: {},
      songRatings: {},
      stageCompletion: {}
    }
  };
  global.__sparkState = null;
  global.SparkState = undefined;
  global.saveState = function() {};
  global.applyCareerRewards = function() {};
  global.SparkCareer = {
    stages: {
      stage_one: { id: "stage_one", songs: ["song_a", "song_b"] }
    }
  };
  global.getCareerItem = function(type, id) {
    if (type === "careers" && id === "career_main") {
      return { id: id, tiers: ["tier_one"] };
    }
    if (type === "tiers" && id === "tier_one") {
      return { id: id, stages: ["stage_one"] };
    }
    if (type === "stages" && id === "stage_one") {
      return { id: id, songs: ["song_a", "song_b"] };
    }
    return null;
  };
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

console.log("\n--- Career State Fallbacks ---");

async function run() {
  await test("career scoring writes progress into plain global S", function() {
    eval(loadJS("js/career/scoring.js"));

    var stars = updateSongCareerRating({
      songId: "song_a",
      arrangementType: "block_chords",
      accuracy: 0.91
    });

    assert.strictEqual(stars, 3);
    assert.ok(S.careerProgress.songRatings["song_a::block_chords"]);
    assert.strictEqual(S.careerProgress.songRatings["song_a::block_chords"].bestStars, 3);
    assert.strictEqual(S.careerProgress.songRatings["song_a::block_chords"].plays, 1);
  });

  await test("career unlock helpers can mutate and query plain global S", function() {
    eval(loadJS("js/career/scoring.js"));
    eval(loadJS("js/career/unlocks.js"));

    evaluateCareerUnlocks("career_main");
    unlockCareerSong("bonus_song");

    assert.strictEqual(S.careerProgress.unlockedTiers.tier_one, true);
    assert.strictEqual(S.careerProgress.unlockedStages.stage_one, true);
    assert.strictEqual(S.careerProgress.unlockedSongs.song_a, true);
    assert.strictEqual(isCareerSongUnlocked("bonus_song"), true);

    updateSongCareerRating({ songId: "song_a", arrangementType: "block_chords", accuracy: 0.86 });
    updateSongCareerRating({ songId: "song_b", arrangementType: "block_chords", accuracy: 0.87 });
    assert.strictEqual(checkStageCompletion("stage_one"), true);
    assert.strictEqual(S.careerProgress.stageCompletion.stage_one, true);
  });

  await test("career engine can recommend and record songs from plain global S", function() {
    eval(loadJS("js/career/scoring.js"));
    eval(loadJS("js/career/unlocks.js"));
    eval(loadJS("js/career/engine.js"));

    evaluateCareerUnlocks("career_main");
    assert.strictEqual(getRecommendedCareerSong(), "song_a");

    recordCareerPerformance({
      songId: "song_a",
      arrangementType: "block_chords",
      accuracy: 0.9
    });

    assert.strictEqual(findCareerStageForSong("song_a"), "stage_one");
    assert.strictEqual(hasSongClearedCareer("song_a"), true);
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
