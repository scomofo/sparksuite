var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  global.eval(fs.readFileSync(path.join(__dirname, "..", file), "utf8"));
}

global.window = global;
global.S = {
  level: 1,
  transitionStats: {},
  performanceStats: {},
  metaProgress: {
    skillPoints: 0
  }
};
global.CURRICULUM = [
  {
    num: 1,
    title: "Start",
    chords: ["C", "G"]
  }
];
global.SparkChordProgress = {
  get: function() {
    return 50;
  }
};
global.saveState = function() {};

loadJS("js/progression/skill_tree.js");
// The unlock policy lives in ProgressEngine; index.html loads it (line 237)
// well before js/meta/skill_tree_meta.js (line 257).
loadJS("js/sparksuite/core/progress_engine.js");
loadJS("js/meta/skill_tree_meta.js");

var tree = buildSkillTree();

assert.ok(tree && Array.isArray(tree.branches), "canonical buildSkillTree should still return branches after meta boot");
assert.strictEqual(typeof unlockMetaSkill, "function");
assert.strictEqual(typeof awardSkillPoint, "function");

// --- The meta layer applies the engine's decision, it does not make one ----

var defaults = SparkSuiteProgressEngine.getDefaultMetaSkillTree();
assert.strictEqual(defaults.rhythm_1.unlocked, true, "the starter skill is unlocked by default");
assert.strictEqual(defaults.chords_barre.cost, 3, "skill costs come from the engine");
defaults.chords_barre.cost = 99;
assert.strictEqual(
  SparkSuiteProgressEngine.getDefaultMetaSkillTree().chords_barre.cost,
  3,
  "callers get a copy — mutating it must not corrupt the engine's defaults"
);

S.skillTree = null;
S.metaProgress.skillPoints = 0;

// Refusals leave state untouched.
assert.strictEqual(unlockMetaSkill("rhythm_2").reason, "no_skill_points");
assert.strictEqual(S.metaProgress.skillPoints, 0);
assert.strictEqual(S.skillTree.rhythm_2.unlocked, false);

// A free skill still cannot be taken on a zero balance — the pre-existing
// behaviour, preserved deliberately by the refusal ordering in the engine.
assert.strictEqual(unlockMetaSkill("lh_patterns").reason, "no_skill_points");

S.metaProgress.skillPoints = 2;
assert.strictEqual(unlockMetaSkill("chords_barre").reason, "insufficient_skill_points", "cost 3 > 2 points");
assert.strictEqual(S.metaProgress.skillPoints, 2, "a refused unlock spends nothing");

var unlocked = unlockMetaSkill("rhythm_2");
assert.strictEqual(unlocked.unlocked, true);
assert.strictEqual(S.skillTree.rhythm_2.unlocked, true, "the applier persists the engine's tree");
assert.strictEqual(S.metaProgress.skillPoints, 0, "cost 2 is deducted once");

assert.strictEqual(unlockMetaSkill("rhythm_2").reason, "already_unlocked", "unlocking twice is refused");
assert.strictEqual(unlockMetaSkill("no_such_skill").reason, "unknown_skill");

// The decision itself is pure — it must not reach into S.
var before = JSON.stringify(S.skillTree);
SparkSuiteProgressEngine.evaluateSkillUnlock({
  skillTree: S.skillTree,
  skillId: "sight_reading",
  skillPoints: 10
});
assert.strictEqual(JSON.stringify(S.skillTree), before, "evaluateSkillUnlock must not mutate the tree it is given");

console.log("PASS: skill tree boot order preserves the canonical builder; unlock policy is engine-owned");
