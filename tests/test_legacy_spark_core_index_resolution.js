var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetEnvironment() {
  global.window = global;
  global.SparkSession = {
    buildSession: function(opts) {
      return opts;
    }
  };
  global.SparkInstrumentAdapter = {
    getAppId: function() { return "chordspark"; },
    getInstrumentType: function() { return "guitar"; },
    getCurriculum: function() { return { source: "adapter" }; }
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
          return { source: "registry" };
        }
      }];
    }
  };
}

function test(name, fn) {
  try {
    resetEnvironment();
    global.eval(loadJS("js/spark-core/index.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.stack);
    process.exitCode = 1;
  }
}

console.log("\n--- Legacy Spark Core Index Resolution ---");

test("startSession prefers the active registry instrument over a stale adapter singleton", function() {
  var result = SparkCore.startSession({ mode: "quickStart" });
  assert.strictEqual(result.instrumentId, "pianospark");
  assert.strictEqual(result.instrumentType, "piano");
  assert.deepStrictEqual(result.instrumentData, { source: "registry" });
});

if (process.exitCode) process.exit(process.exitCode);
