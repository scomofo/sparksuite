var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  require("vm").runInThisContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), { filename: path.join(__dirname, "..", file) });
}

global.window = global;

loadJS("js/sparksuite/domain/types.js");
loadJS("js/sparksuite/domain/session_segment.js");
loadJS("js/sparksuite/domain/session.js");

var validPlan = {
  id: "plan_test",
  flow: "daily_practice",
  rewards: { xp: 10, unlocks: [], achievements: [] },
  segments: [
    { id: "seg_1", type: "practice", exerciseIds: ["ex_1"] }
  ],
  exercises: [
    { id: "ex_1", type: "practice", data: { core: {} } }
  ]
};

assert.strictEqual(assertSessionPlan(validPlan), validPlan);
assert.strictEqual(SparkSessionV2.assertSessionPlan(validPlan), validPlan);
assert.throws(function() {
  assertSessionPlan({
    flow: "daily_practice",
    rewards: { xp: 10 },
    segments: [{ id: "seg_bad", type: "practice", exerciseIds: ["ex_missing"] }],
    exercises: [{ id: "ex_real", type: "practice", data: { core: {} } }]
  });
}, /references missing exercise/);

console.log("PASS: Session plan contracts can be asserted at runtime boundaries");
