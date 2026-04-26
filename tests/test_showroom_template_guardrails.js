var assert = require("assert");
var fs = require("fs");
var path = require("path");

function load(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function assertAbsent(source, token, file) {
  assert.strictEqual(
    source.indexOf(token),
    -1,
    file + " should not include template token: " + token
  );
}

console.log("\n--- Showroom Template Guardrails ---");

var showroomSource = load("js/showroom/spark-showroom.js");
var legacyProfileSource = load("js/meta/profile.js");

[
  "Alex Chen",
  "Virtuoso",
  "Neon Horizon",
  "Midnight Ember Jam",
  "Guitar Fundamentals",
  "Module 1: Getting Started",
  "Rhythm King",
  "Night Owl"
].forEach(function(token) {
  assertAbsent(showroomSource, token, "js/showroom/spark-showroom.js");
});

assertAbsent(legacyProfileSource, "Player Profile</b></div><div>Level:", "js/meta/profile.js");

assert.ok(showroomSource.indexOf("No badges unlocked yet.") >= 0);
assert.ok(showroomSource.indexOf("No songs loaded for this instrument yet.") >= 0);
assert.ok(showroomSource.indexOf("No completed session yet") >= 0);
assert.ok(showroomSource.indexOf("No performance loaded") >= 0);
assert.ok(showroomSource.indexOf("type: \"theme\"") >= 0);
assert.ok(showroomSource.indexOf("setUIVolume") >= 0);
assert.ok(showroomSource.indexOf("togglePracticeReminder") >= 0);
assert.ok(load("js/render_showroom.js").indexOf("\"settings\"") >= 0);

console.log("  PASS: active profile/showroom surfaces are guarded against template fallbacks");
