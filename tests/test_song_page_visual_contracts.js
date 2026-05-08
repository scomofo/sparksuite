var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  var fullPath = path.join(__dirname, "..", file);
  if (!fs.existsSync(fullPath)) throw new Error("Failed to load " + file + ": file does not exist");
  try {
    return fs.readFileSync(fullPath, "utf8");
  } catch (err) {
    throw new Error("Failed to load " + file + ": " + err.message);
  }
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

function assertIncludes(source, needle) {
  assert.ok(source.indexOf(needle) >= 0, "Expected source to include: " + needle);
}

function assertNotIncludes(source, needle) {
  assert.strictEqual(source.indexOf(needle), -1, "Expected source to omit: " + needle);
}

function assertNotMatches(source, regex, label) {
  assert.strictEqual(regex.test(source), false, "Expected source to omit " + label + ": " + regex);
}

console.log("\n--- Song Page Visual Contracts ---");

test("shared song renderers use visual contract classes", function() {
  var source = loadJS("js/pages/songs.js");

  assertIncludes(source, "card-section-heading");
  assertIncludes(source, "card-micro-heading");
  assertIncludes(source, "metric-label");
  assertIncludes(source, "metric-value");
  assertIncludes(source, "split-row");
  assertIncludes(source, "action-row");
  assertIncludes(source, "song-controls");
});

test("shared song renderers avoid representative raw heavy card headings and no-gap split rows", function() {
  var source = loadJS("js/pages/songs.js");

  assertNotMatches(source, /<h[34][^>]*style=["'][^"']*font-size\s*:\s*1[468]px[^"']*font-weight\s*:\s*(?:800|900)/i, "heavy inline song headings");
  assertNotMatches(source, /display\s*:\s*flex\s*;\s*justify-content\s*:\s*space-between\s*;\s*align-items\s*:\s*center(?![^"']*gap)/i, "no-gap split rows");
  assertNotMatches(source, /display\s*:\s*flex\s*;\s*align-items\s*:\s*center\s*;\s*justify-content\s*:\s*space-between(?![^"']*gap)/i, "no-gap reversed split rows");
});

test("piano song renderers use shared classes for card headings, meta, controls, and split rows", function() {
  var source = loadJS("js/instruments/piano/pages/songs.js");

  assertIncludes(source, "card-section-heading");
  assertIncludes(source, "card-micro-heading");
  assertIncludes(source, "metric-label");
  assertIncludes(source, "metric-value");
  assertIncludes(source, "split-row");
  assertIncludes(source, "action-row");
  assertIncludes(source, "song-controls");
  assertNotIncludes(source, '<div class="card"><h2>Song Library</h2>');
  assertNotIncludes(source, '<h3>Stem Separator</h3>');
  assertNotMatches(source, /display\s*:\s*flex\s*;\s*justify-content\s*:\s*space-between\s*;\s*align-items\s*:\s*center(?![^"']*gap)/i, "no-gap split rows");
  assertNotMatches(source, /display\s*:\s*flex\s*;\s*align-items\s*:\s*center\s*;\s*justify-content\s*:\s*space-between(?![^"']*gap)/i, "no-gap reversed split rows");
});

if (process.exitCode) process.exit(process.exitCode);
