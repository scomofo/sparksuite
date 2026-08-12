// ===== Meta Economy Tests =====
// Run: node tests/test_meta_economy.js
//
// Behavioral coverage for the XP/leveling/reward economy in js/meta/:
// levels.js + xp.js run together (real awardXP -> real checkLevelUp),
// plus meta_progress.js, challenge_rewards.js, and pack_rewards.js.
// Regressions here are immediately user-visible (wrong levels, double
// rewards, lost XP), so the math and idempotency rules are pinned.

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

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
  var full = path.join(__dirname, "..", file);
  vm.runInThisContext(fs.readFileSync(full, "utf8"), { filename: full });
}

var calls;

function resetState() {
  global.window = global;
  global.S = {
    playerXP: 0,
    playerLevel: 1,
    activeChallenges: []
  };
  calls = {
    saveState: 0,
    toasts: [],
    skillPoints: 0,
    achievements: 0,
    unlockedContent: [],
    unlockedAchievements: [],
    challengeProgress: [],
    weeklyGoals: []
  };
  global.saveState = function() { calls.saveState++; };
  global.showToast = function(msg) { calls.toasts.push(msg); };
  global.awardSkillPoint = function() { calls.skillPoints++; };
  global.evaluateAchievements = function() { calls.achievements++; };
  global.unlockContent = function(kind, id) { calls.unlockedContent.push([kind, id]); };
  global.unlockAchievement = function(id) { calls.unlockedAchievements.push(id); };
  global.updateChallengeProgress = function(kind, amount) { calls.challengeProgress.push([kind, amount]); };
  global.updateWeeklyGoal = function(kind, amount) { calls.weeklyGoals.push([kind, amount]); };
  global.getPackReward = function(packId) {
    return { xp: 50, achievementId: "pack_" + packId, skillPoints: 2 };
  };
}

resetState();
loadJS("js/meta/levels.js");
loadJS("js/meta/xp.js");
loadJS("js/meta/meta_progress.js");
loadJS("js/meta/challenge_rewards.js");
loadJS("js/meta/pack_rewards.js");

console.log("=== Meta Economy Tests ===");

test("xpForLevel follows the 100 * level^1.5 curve", function() {
  assert.strictEqual(xpForLevel(1), 100);
  assert.strictEqual(xpForLevel(2), Math.floor(100 * Math.pow(2, 1.5)));
  assert.strictEqual(xpForLevel(4), 800);
  assert.ok(xpForLevel(5) > xpForLevel(4), "curve must be increasing");
});

test("checkLevelUp climbs multiple levels in one pass", function() {
  S.playerXP = 1000; // past levels 2 (282), 3 (519), 4 (800); short of 5 (1118)
  checkLevelUp();
  assert.strictEqual(S.playerLevel, 4);
  assert.strictEqual(calls.toasts.length, 3, "one toast per level gained");
  assert.strictEqual(calls.skillPoints, 3, "one skill point per level gained");
});

test("getLevelProgress reports fraction toward next level, clamped", function() {
  S.playerLevel = 1;
  S.playerXP = 100;
  assert.strictEqual(getLevelProgress(), 0);
  S.playerXP = xpForLevel(2);
  assert.strictEqual(getLevelProgress(), 1);
  S.playerXP = 191; // exactly halfway between 100 and 282
  assert.ok(Math.abs(getLevelProgress() - 0.5) < 0.01);
  S.playerXP = 0;
  assert.strictEqual(getLevelProgress(), 0, "progress never goes negative");
});

test("awardXP adds XP, logs the reason, levels up, and saves", function() {
  awardXP(300, "test_reason");
  assert.strictEqual(S.playerXP, 300);
  assert.strictEqual(S.playerLevel, 2);
  assert.strictEqual(S.xpLog.length, 1);
  assert.strictEqual(S.xpLog[0].xp, 300);
  assert.strictEqual(S.xpLog[0].reason, "test_reason");
  assert.ok(calls.saveState >= 1);
});

test("awardXP with zero amount is a no-op", function() {
  awardXP(0, "nothing");
  assert.strictEqual(S.playerXP, 0);
  assert.ok(!S.xpLog);
  assert.strictEqual(calls.saveState, 0);
});

test("performance completion feeds challenges and weekly goals", function() {
  updateMetaProgressFromPerformance({ durationMin: 7 });
  assert.deepStrictEqual(calls.challengeProgress, [
    ["complete_song", 1],
    ["practice_minutes", 7]
  ]);
  assert.deepStrictEqual(calls.weeklyGoals, [
    ["songs_completed", 1],
    ["practice_minutes", 7]
  ]);
  assert.strictEqual(calls.saveState, 1);
});

test("performance without duration skips practice minutes", function() {
  updateMetaProgressFromPerformance({});
  assert.deepStrictEqual(calls.challengeProgress, [["complete_song", 1]]);
  updateMetaProgressFromPerformance(null);
  assert.deepStrictEqual(calls.challengeProgress, [["complete_song", 1]], "null result must be ignored");
});

test("claiming a completed challenge applies rewards exactly once", function() {
  S.activeChallenges = [{
    id: "ch1",
    completed: true,
    claimed: false,
    rewards: { xp: 120, skillPoints: 2, unlockIds: ["lesson_a", "lesson_b"] }
  }];
  assert.strictEqual(claimChallengeReward("ch1"), true);
  assert.strictEqual(S.playerXP, 120, "challenge XP must flow through real awardXP");
  assert.strictEqual(calls.skillPoints, 2);
  assert.deepStrictEqual(calls.unlockedContent, [["lessons", "lesson_a"], ["lessons", "lesson_b"]]);
  assert.strictEqual(S.challengeRewards.claimed.ch1, true);

  // Second claim must be rejected — the challenge is already claimed.
  assert.strictEqual(claimChallengeReward("ch1"), false);
  assert.strictEqual(S.playerXP, 120, "no double XP on re-claim");
});

test("incomplete or unknown challenges cannot be claimed", function() {
  S.activeChallenges = [{ id: "ch2", completed: false, rewards: { xp: 10 } }];
  assert.strictEqual(claimChallengeReward("ch2"), false);
  assert.strictEqual(claimChallengeReward("missing"), false);
  assert.strictEqual(S.playerXP, 0);
});

test("findActiveChallengeById scans the active list", function() {
  S.activeChallenges = [{ id: "a" }, { id: "b" }];
  assert.strictEqual(findActiveChallengeById("b").id, "b");
  assert.strictEqual(findActiveChallengeById("zzz"), null);
});

test("completing a pack grants its reward exactly once", function() {
  updatePackCompletion("starter", 0.5);
  assert.strictEqual(S.packCompletion.packs.starter.completed, false);
  assert.strictEqual(S.playerXP, 0, "partial progress grants nothing");

  updatePackCompletion("starter", 1);
  assert.strictEqual(S.packCompletion.packs.starter.completed, true);
  assert.strictEqual(S.playerXP, 50);
  assert.deepStrictEqual(calls.unlockedAchievements, ["pack_starter"]);
  assert.strictEqual(calls.skillPoints, 2);
  assert.strictEqual(S.challengeRewards.packClaimed.starter, true);

  // Reporting progress again must not re-grant.
  updatePackCompletion("starter", 1);
  assert.strictEqual(S.playerXP, 50);
  assert.deepStrictEqual(calls.unlockedAchievements, ["pack_starter"]);
});

test("getPackCompletionRatio reports stored progress", function() {
  updatePackCompletion("p1", 0.4);
  assert.strictEqual(getPackCompletionRatio("p1"), 0.4);
  assert.strictEqual(getPackCompletionRatio("unknown"), 0);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
