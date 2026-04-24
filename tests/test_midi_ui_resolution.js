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

console.log("\n--- MIDI UI Resolution ---");

test("midi settings and import pages route utility buttons through app actions", function() {
  var midiSettingsSource = loadJS("js/midi/ui.js");
  var midiImportSource = loadJS("js/import/midi_ui.js");
  assert.ok(midiSettingsSource.indexOf("act(\\'refreshMidiDevices\\')") >= 0);
  assert.ok(midiImportSource.indexOf("act(\\'importMidiDesktop\\')") >= 0);
});

test("utility family handles midi refresh and desktop import actions", function() {
  var utilitySource = loadJS("js/actions/utility_family.js");
  assert.ok(utilitySource.indexOf('if (a === "refreshMidiDevices") {') >= 0);
  assert.ok(utilitySource.indexOf('if (typeof refreshMidiDevices === "function") refreshMidiDevices();') >= 0);
  assert.ok(utilitySource.indexOf('if (a === "importMidiDesktop") {') >= 0);
  assert.ok(utilitySource.indexOf('if (typeof importMidiDesktopAware === "function") importMidiDesktopAware();') >= 0);
});

test("piano runtime mirrors midi refresh and desktop import actions", function() {
  var pianoSource = loadJS("js/instruments/piano/app.js");
  assert.ok(pianoSource.indexOf('case "refreshMidiDevices":') >= 0);
  assert.ok(pianoSource.indexOf('if (typeof refreshMidiDevices === "function") refreshMidiDevices();') >= 0);
  assert.ok(pianoSource.indexOf('case "importMidiDesktop":') >= 0);
  assert.ok(pianoSource.indexOf('if (typeof importMidiDesktopAware === "function") importMidiDesktopAware();') >= 0);
});

if (process.exitCode) process.exit(process.exitCode);
