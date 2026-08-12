var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  require("vm").runInThisContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), { filename: path.join(__dirname, "..", file) });
}

global.window = global;
global.SparkInstruments = {
  getActive: function() {
    return {
      id: "bassspark",
      instrument: "bass",
      getCurriculumMap: function() {
        return [
          { num: 1, title: "First Groove", skills: ["posture"] }
        ];
      },
      getSkillTree: function() {
        return {
          branches: [
            { id: "level_1", label: "First Groove" }
          ]
        };
      }
    };
  },
  getAll: function() {
    return [this.getActive()];
  }
};
global.SparkBassModule = {
  getLessons: function() {
    return [
      { id: "bass_level_1", title: "First Groove", skill: "posture", prerequisites: [], masteryRequired: 0.7 }
    ];
  },
  getCurriculumMap: function() {
    return [
      { id: "bass_level_1", title: "First Groove", skill: "posture", prerequisites: [], masteryRequired: 0.7 }
    ];
  },
  getSkillTree: function() {
    return {
      fundamentals: ["posture", "plucking"]
    };
  },
  getExercises: function() {
    return [{ id: "bass_ex_1", type: "rhythm_highway" }];
  },
  getTuning: function() {
    return ["E1", "A1", "D2", "G2"];
  },
  getSongs: function() {
    return [];
  },
  getCapabilities: function() {
    return {
      preferredRenderer: "string-lane-highway",
      inputModes: ["keyboard", "midi"]
    };
  }
};

loadJS("js/sparksuite/content/validate_instrument_module.js");
loadJS("js/sparksuite/instruments/bass/bass_adapter.js");

var adapter = new SparkBassAdapter();

assert.strictEqual(adapter.getLessons()[0].id, "bass_level_1");
assert.doesNotThrow(function() {
  SparkValidateInstrumentModule(adapter, "bass");
});

console.log("PASS: bass adapter prefers the canonical bass module over the UI registration entry");
