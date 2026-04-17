var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnvironment() {
  global.window = global;
  global.S = {};
  global.__sparkState = global.S;
  global.SparkPsychology = {
    getSessionStructure: function(type) {
      return { instrumentType: type };
    }
  };
  global.SparkInstruments = {
    getActive: function() {
      return { appId: "pianospark" };
    },
    getAll: function() {
      return [{
        id: "pianospark",
        appId: "pianospark",
        instrument: "piano",
        getData: function() {
          return { SESSIONS: ["intro"] };
        },
        getCurriculumMap: function() {
          return ["piano_root"];
        }
      }];
    }
  };
}

function test(name, fn) {
  try {
    resetEnvironment();
    eval(loadJS("js/spark-core/instrument-adapter.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Instrument Adapter ---");

test("adapter resolves thin appId-only active instruments through the registry", function() {
  assert.strictEqual(SparkInstrumentAdapter.getAppId(), "pianospark");
  assert.strictEqual(SparkInstrumentAdapter.getInstrumentType(), "piano");
  assert.deepStrictEqual(SparkInstrumentAdapter.getCurriculum(), { SESSIONS: ["intro"] });
  assert.deepStrictEqual(SparkInstrumentAdapter.getCurriculumMap(), ["piano_root"]);
  assert.deepStrictEqual(SparkInstrumentAdapter.getSessionStructure(), { instrumentType: "piano" });
});

if (process.exitCode) process.exit(process.exitCode);
