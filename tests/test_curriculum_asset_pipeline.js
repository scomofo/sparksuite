const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const GUITAR_ACTIVITIES = path.join(ROOT, "curriculum", "v2", "activities", "guitar-30day.activities.json");
const LOOP_METADATA = path.join(ROOT, "assets", "audio", "common", "loop-metadata.generated.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function test(name, fn) {
  try {
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Curriculum Asset Pipeline ---");

test("song-block curriculum activities expose audio loop metadata", function() {
  const bundle = readJson(GUITAR_ACTIVITIES);
  const songActivity = bundle.activities.find((activity) => activity.block_type === "song");
  assert.ok(songActivity, "missing song activity");
  assert.ok(songActivity.audio, "song activity missing audio metadata");
  assert.ok(songActivity.audio.backing_track.indexOf("assets/audio/guitar/backing/") >= 0);
  assert.strictEqual(songActivity.audio.loop, true);
  assert.ok(Number(songActivity.audio.tempo_bpm) > 0);
});

test("generated loop metadata file exists and contains loop entries", function() {
  assert.ok(fs.existsSync(LOOP_METADATA), "missing loop metadata file");
  const manifest = readJson(LOOP_METADATA);
  assert.ok(Array.isArray(manifest.loops), "missing loops array");
  assert.ok(manifest.loop_count > 0, "expected at least one loop entry");
  assert.strictEqual(manifest.loop_count, manifest.loops.length);
  const first = manifest.loops[0];
  assert.ok(first.backing_track, "loop entry missing backing track");
  assert.strictEqual(first.loop, true);
});

if (process.exitCode) process.exit(process.exitCode);
