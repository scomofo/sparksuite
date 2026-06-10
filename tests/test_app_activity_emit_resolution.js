var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function extractFunction(source, name) {
  var marker = "function " + name + "()";
  var start = source.indexOf(marker);
  var braceStart;
  var depth;
  var i;
  if (start < 0) throw new Error("Missing function: " + name);
  braceStart = source.indexOf("{", start);
  depth = 0;
  for (i = braceStart; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error("Unclosed function: " + name);
}

function resetEnvironment() {
  global.window = global;
  global.SparkInstruments = {
    getActive: function() {
      return { appId: "pianospark" };
    },
    getAll: function() {
      return [{
        id: "pianospark",
        appId: "pianospark",
        instrument: "piano"
      }];
    }
  };
}

function test(name, fn) {
  try {
    resetEnvironment();
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.stack);
    process.exitCode = 1;
  }
}

console.log("\n--- App Activity Emit Resolution ---");

test("activity identity helper rehydrates a thin active instrument shell", function() {
  // Helper relocated to js/orchestrator-requests.js during the app.js split.
  var source = loadJS("js/orchestrator-requests.js");
  global.eval(extractFunction(source, "getActiveInstrumentIdentityForActivity"));
  var result = getActiveInstrumentIdentityForActivity();
  assert.deepStrictEqual(result, {
    appId: "pianospark",
    instrumentType: "piano"
  });
});

test("app drill and song completion emits use the resolved activity instrument app id", function() {
  // After the app.js split: drill completion emits live in js/timers.js,
  // song completion emits live in js/actions.js.
  var drillSource = loadJS("js/timers.js");
  assert.ok(drillSource.indexOf('emit:{type:"practice_session_completed",payload:{ appId: activityInstrument.appId, type: "drill", xp: 20, detail: detail }}') >= 0);
  assert.ok(drillSource.indexOf('_sparkEmit("practice_session_completed", { appId: activityInstrument.appId, type: "drill", xp: 20, detail: detail });') >= 0);

  var songSource = loadJS("js/actions.js");
  assert.ok(songSource.indexOf('emit:{type:"lesson_completed",payload:{ appId: songActivityInstrument.appId, lessonId: "song_" + (S.selectedSong ? S.selectedSong.title : ""), xp: 40 }}') >= 0);
  assert.ok(songSource.indexOf('_sparkEmit("lesson_completed", { appId: songActivityInstrument.appId, lessonId: "song_" + (S.selectedSong ? S.selectedSong.title : ""), xp: 40 });') >= 0);
});

if (process.exitCode) process.exit(process.exitCode);
