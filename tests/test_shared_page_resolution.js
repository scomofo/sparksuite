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

console.log("\n--- Shared Page Resolution ---");

test("shortcut overlay handles escape key dismissal", function() {
  var source = loadJS("js/pages/shared.js");
  assert.ok(source.indexOf('class="shortcut-overlay" onclick="act(\\\'toggleShortcuts\\\')" onkeydown="if(event.key===\\\'Escape\\\'){event.preventDefault();act(\\\'toggleShortcuts\\\')}" role="dialog" tabindex="0"') >= 0);
});

if (process.exitCode) process.exit(process.exitCode);
