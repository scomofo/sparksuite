var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;
var tests = [];

function test(name, fn) {
  tests.push({ name: name, fn: fn });
}

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

global.window = global;

var responses = {};

global.fetch = function(targetPath) {
  if (!Object.prototype.hasOwnProperty.call(responses, targetPath)) {
    return Promise.reject(new Error("Unexpected fetch path: " + targetPath));
  }
  return Promise.resolve({
    ok: responses[targetPath]
  });
};

eval(loadJS("js/sparksuite/audio/stem_loader.js"));

console.log("=== Stem Loader Tests ===");

test("hasStemsOnDisk detects mp3 stem sets", async function() {
  responses = {
    "data/stems/night_drive/vocals.wav": false,
    "data/stems/night_drive/vocals.mp3": true
  };

  var loader = new SparkStemLoader();
  var found = await loader.hasStemsOnDisk("night_drive");
  assert.strictEqual(found, true);
});

test("hasStemsOnDisk detects non-vocal supported stems", async function() {
  responses = {
    "data/stems/career_anthem/vocals.wav": false,
    "data/stems/career_anthem/vocals.mp3": false,
    "data/stems/career_anthem/vocals.ogg": false,
    "data/stems/career_anthem/drums.wav": false,
    "data/stems/career_anthem/drums.mp3": false,
    "data/stems/career_anthem/drums.ogg": true
  };

  var loader = new SparkStemLoader();
  var found = await loader.hasStemsOnDisk("career_anthem");
  assert.strictEqual(found, true);
});

test("hasStemsOnDisk returns false when no supported stems exist", async function() {
  responses = {
    "data/stems/empty_track/vocals.wav": false,
    "data/stems/empty_track/vocals.mp3": false,
    "data/stems/empty_track/vocals.ogg": false,
    "data/stems/empty_track/drums.wav": false,
    "data/stems/empty_track/drums.mp3": false,
    "data/stems/empty_track/drums.ogg": false,
    "data/stems/empty_track/bass.wav": false,
    "data/stems/empty_track/bass.mp3": false,
    "data/stems/empty_track/bass.ogg": false,
    "data/stems/empty_track/guitar.wav": false,
    "data/stems/empty_track/guitar.mp3": false,
    "data/stems/empty_track/guitar.ogg": false,
    "data/stems/empty_track/other.wav": false,
    "data/stems/empty_track/other.mp3": false,
    "data/stems/empty_track/other.ogg": false
  };

  var loader = new SparkStemLoader();
  var found = await loader.hasStemsOnDisk("empty_track");
  assert.strictEqual(found, false);
});

async function run() {
  for (var i = 0; i < tests.length; i++) {
    try {
      await tests[i].fn();
      passed++;
      console.log("  PASS: " + tests[i].name);
    } catch (err) {
      failed++;
      console.error("  FAIL: " + tests[i].name);
      console.error("    " + err.message);
    }
  }

  console.log("\n" + passed + " passed, " + failed + " failed");
  if (failed > 0) process.exit(1);
}

run();
