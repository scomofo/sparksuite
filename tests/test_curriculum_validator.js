const assert = require("assert");
const validator = require("../js/dev/curriculum_validator.js");

function makeInstrument(overrides) {
  return Object.assign({
    id: "testspark",
    instrument: "test",
    getSkillTree() {
      return { branches: [{ id: "basics", nodes: [{ id: "open_chords" }] }] };
    },
    getCurriculumMap() {
      return [
        { id: "lesson_1", num: 1, skill: "missing_skill", prerequisites: ["missing_prereq"], chords: ["Zmaj"], masteryRequired: 1.2 },
        { id: "lesson_1", num: 2, skill: "open_chords" }
      ];
    },
    getData() {
      return { LC: { 1: "#fff" }, LN: { 1: "One" }, ALL_CHORDS: { C: {} } };
    },
    getExercises() {
      return [{ id: "ex_1", skill: "open_chords" }];
    }
  }, overrides || {});
}

const issues = validator.validateCurriculum(makeInstrument());
const codes = issues.map((issue) => issue.code);

assert(codes.includes("SKILL_NOT_IN_TREE"), "missing lesson skill should be structured");
assert(codes.includes("PREREQ_NOT_IN_TREE"), "missing prerequisite should be structured");
assert(codes.includes("CHORD_NOT_IN_DATA"), "missing chord should be structured");
assert(codes.includes("DUPLICATE_LESSON_ID"), "duplicate lesson id should be structured");
assert(codes.includes("MASTERY_OUT_OF_RANGE"), "out of range mastery should be structured");
assert(codes.includes("LC_MISSING"), "missing level color should be structured");
assert(codes.includes("LN_MISSING"), "missing level name should be structured");

issues.forEach((issue) => {
  assert(issue.code, "issue code required");
  assert(["error", "warning", "info"].includes(issue.severity), "stable severity required");
  assert(issue.category, "category required");
  assert(issue.instrument === "testspark", "instrument id required");
  assert(issue.target, "target required");
  assert(issue.message, "message required");
});

const grouped = validator.groupIssues(issues);
assert(grouped.skills.missing_skill, "skill issues should group by target");
assert(grouped.lessons.lesson_1, "lesson issues should group by target");
assert(grouped.levels["2"], "level issues should group by target");

const emptyIssues = validator.validateCurriculum(makeInstrument({
  getCurriculumMap() { return []; },
  getSkillTree() { return []; },
  getExercises() { return []; }
}));

assert(emptyIssues.some((issue) => issue.code === "CURRICULUM_EMPTY" && issue.severity === "error"));
assert(emptyIssues.some((issue) => issue.code === "SKILL_TREE_EMPTY" && issue.severity === "warning"));
assert(emptyIssues.some((issue) => issue.code === "EXERCISES_EMPTY" && issue.severity === "info"));

console.log("test_curriculum_validator passed");
