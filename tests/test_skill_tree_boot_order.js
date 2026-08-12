var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  require("vm").runInThisContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), { filename: path.join(__dirname, "..", file) });
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
loadJS("js/meta/skill_tree_meta.js");

var tree = buildSkillTree();

assert.ok(tree && Array.isArray(tree.branches), "canonical buildSkillTree should still return branches after meta boot");
assert.strictEqual(typeof unlockMetaSkill, "function");
assert.strictEqual(typeof awardSkillPoint, "function");

console.log("PASS: skill tree boot order preserves the canonical progression tree builder");
