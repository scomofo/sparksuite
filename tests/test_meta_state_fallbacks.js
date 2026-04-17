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
    playerStats: {
      songsCompleted: 2,
      totalPracticeMinutes: 120
    },
    practiceStreak: 7,
    playerLevel: 4,
    level: 4,
    playerXP: 1200,
    xp: 1200,
    playerAchievements: {},
    metaProgress: {
      challengesCompleted: 0
    },
    challengeRewards: {},
    packCompletion: {}
  };
  global.__sparkState = null;
  global.SparkState = undefined;
  global.toasts = [];
  global.showToast = function(message) {
    toasts.push(message);
  };
  global.saveState = function() {};
  global.awardXpCalls = [];
  global.awardXP = function(amount, source) {
    awardXpCalls.push({ amount: amount, source: source });
    S.playerXP = (S.playerXP || 0) + amount;
    S.xp = S.playerXP;
  };
  global.skillPointAwards = 0;
  global.awardSkillPoint = function() {
    skillPointAwards++;
  };
  global.generateIdCounter = 0;
  global.generateId = function(prefix) {
    generateIdCounter += 1;
    return String(prefix || "id") + "_" + generateIdCounter;
  };
  global.getSeasonalEvent = function(id) {
    if (id !== "spring_fest") return null;
    return {
      id: id,
      title: "Spring Fest",
      challenges: [
        { type: "practice_minutes", target: 2, progress: 0, completed: false }
      ],
      rewards: {
        xp: 75,
        skillPoints: 2
      }
    };
  };
  global.getPackReward = function(packId) {
    if (packId !== "pack_alpha") return null;
    return {
      xp: 80,
      achievementId: "pack_alpha_complete",
      skillPoints: 1
    };
  };
  global.unlockAchievement = function(reward) {
    var id = typeof reward === "string" ? reward : reward.id;
    S.playerAchievements[id] = true;
  };
  global.evaluateAchievements = function() {};
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

console.log("\n--- Meta State Fallbacks ---");

async function run() {
  await test("achievement and level helpers can use plain global S", function() {
    eval(loadJS("js/meta/achievements.js"));
    eval(loadJS("js/meta/levels.js"));

    evaluateAchievements();
    checkLevelUp();

    assert.strictEqual(S.playerAchievements.first_song, true);
    assert.strictEqual(S.playerAchievements.practice_100, true);
    assert.strictEqual(S.playerAchievements.streak_7, true);
    assert.strictEqual(S.playerLevel, 5);
    assert.strictEqual(S.level, 5);
    assert.ok(getLevelProgress() >= 0);
  });

  await test("daily challenges can generate and complete through plain global S", function() {
    eval(loadJS("js/meta/challenges.js"));

    generateDailyChallenges();
    updateChallengeProgress("practice_minutes", 15);

    assert.strictEqual(Array.isArray(S.dailyChallenges), true);
    assert.strictEqual(S.dailyChallenges.length, 3);
    assert.strictEqual(S.dailyChallenges[0].completed, true);
    assert.strictEqual(S.metaProgress.challengesCompleted, 1);
    assert.strictEqual(S.challengeHistory.length, 1);
  });

  await test("seasonal events and pack rewards can grant through plain global S", function() {
    eval(loadJS("js/meta/events.js"));
    eval(loadJS("js/meta/pack_rewards.js"));

    assert.strictEqual(activateSeasonalEvent("spring_fest"), true);
    updateSeasonalChallengeProgress("practice_minutes", 2);
    updatePackCompletion("pack_alpha", 1);

    assert.strictEqual(getActiveSeasonalEvent().id, "spring_fest");
    assert.strictEqual(S.challengeRewards.eventClaimed.spring_fest, true);
    assert.strictEqual(S.challengeRewards.packClaimed.pack_alpha, true);
    assert.strictEqual(S.packCompletion.packs.pack_alpha.completed, true);
    assert.strictEqual(S.playerAchievements.pack_alpha_complete, true);
    assert.strictEqual(skillPointAwards, 3);
    assert.strictEqual(getPackCompletionRatio("pack_alpha"), 1);
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
