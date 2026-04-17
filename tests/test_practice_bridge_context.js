var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.SparkSessionSegmentTypes = {
    WARMUP: "warmup",
    RHYTHM_HIGHWAY: "rhythm_highway"
  };
  global.SparkSessionSegment = {
    create: function(segment) {
      return segment;
    }
  };
}

function test(name, fn) {
  try {
    resetState();
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Practice Bridge Context ---");

test("buildDailyPracticeSegments forwards instrument context to candidate selection", function() {
  var receivedContext = null;
  global.buildPracticeCandidates = function(context) {
    receivedContext = context;
    return [{
      id: "perf_piano_daydreams",
      type: "performance_song",
      label: "Replay Piano Daydreams",
      reason: "Recent piano performance needs another pass",
      meta: { songId: "piano_daydreams" }
    }];
  };

  eval(loadJS("js/sparksuite/bridges/practice_bridge.js"));

  var segments = SparkPracticeBridge.buildDailyPracticeSegments({
    instrumentContext: {
      instrumentType: "piano",
      appId: "pianospark"
    }
  });

  assert.ok(receivedContext);
  assert.strictEqual(receivedContext.instrumentContext.instrumentType, "piano");
  assert.strictEqual(segments.length, 1);
  assert.strictEqual(segments[0].label, "Replay Piano Daydreams");
});

if (process.exitCode) process.exit(process.exitCode);
