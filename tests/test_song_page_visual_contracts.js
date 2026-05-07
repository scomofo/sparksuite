var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
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

  assertNotIncludes(source, '<h3 style="margin:0;font-size:16px;font-weight:800;color:var(--text-primary)"');
  assertNotIncludes(source, '<h4 style="margin:0 0 10px;font-size:14px;font-weight:800;color:var(--text-primary)"');
  assertNotIncludes(source, '<h3 style="margin:0 0 6px;font-size:18px;font-weight:900;color:var(--text-primary)"');
  assertNotIncludes(source, 'display:flex;justify-content:space-between;align-items:center"');
  assertNotIncludes(source, 'display:flex;align-items:center;justify-content:space-between;padding');
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
  assertNotIncludes(source, 'display:flex;justify-content:space-between;align-items:center"');
  assertNotIncludes(source, 'display:flex;align-items:center;justify-content:space-between;padding');
});

if (process.exitCode) process.exit(process.exitCode);
