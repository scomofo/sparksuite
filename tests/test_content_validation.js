const assert = require("assert");

const validators = require("../js/sparksuite/content/validate_instrument_module.js");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log("PASS:", name);
  } catch (error) {
    failed += 1;
    console.error("FAIL:", name, "--", error.message);
  }
}

function createValidModule() {
  return {
    getId() { return "canaryspark"; },
    getType() { return "canary"; },
    getCurriculumMap() {
      return [
        { id: "lesson_1", title: "First sound", skill: "pulse_lock", prerequisites: [], masteryRequired: 0.7 }
      ];
    },
    getSkillTree() {
      return [{ id: "pulse_lock", title: "Pulse Lock" }];
    },
    getLessons() {
      return [
        { id: "lesson_1", title: "First sound", skill: "pulse_lock", prerequisites: [], masteryRequired: 0.7 }
      ];
    },
    getExercises() {
      return [{ id: "exercise_1", type: "rhythm_highway" }];
    },
    getTuning() {
      return ["C4", "G4"];
    },
    getCapabilities() {
      return {
        preferredRenderer: "string-lane-highway",
        inputModes: ["keyboard", "midi"]
      };
    }
  };
}

test("validateInstrumentModule accepts a valid module", function() {
  assert.strictEqual(validators.validateInstrumentModule(createValidModule(), "canary"), true);
});

test("validateInstrumentModule rejects duplicate lesson ids", function() {
  const moduleApi = createValidModule();
  moduleApi.getLessons = function() {
    return [
      { id: "lesson_1", title: "First sound", skill: "pulse_lock", prerequisites: [] },
      { id: "lesson_1", title: "Duplicate", skill: "pulse_lock", prerequisites: [] }
    ];
  };

  assert.throws(function() {
    validators.validateInstrumentModule(moduleApi, "canary");
  }, /duplicate lesson id/);
});

test("validateInstrumentModule rejects missing prerequisite skills", function() {
  const moduleApi = createValidModule();
  moduleApi.getLessons = function() {
    return [
      { id: "lesson_1", title: "First sound", skill: "pulse_lock", prerequisites: ["missing_skill"] }
    ];
  };

  assert.throws(function() {
    validators.validateInstrumentModule(moduleApi, "canary");
  }, /missing prerequisite/);
});

test("validateInstrumentModule rejects invalid capabilities", function() {
  const moduleApi = createValidModule();
  moduleApi.getCapabilities = function() {
    return { inputModes: "keyboard" };
  };

  assert.throws(function() {
    validators.validateInstrumentModule(moduleApi, "canary");
  }, /preferredRenderer/);
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
