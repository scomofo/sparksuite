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
  assert.ok(utilitySource.indexOf('Promise.resolve().then(function() { return importMidiDesktopAware();') >= 0);
});

test("piano runtime mirrors midi refresh and desktop import actions", function() {
  var pianoSource = loadJS("js/instruments/piano/app.js");
  assert.ok(pianoSource.indexOf('case "refreshMidiDevices":') >= 0);
  assert.ok(pianoSource.indexOf('if (typeof refreshMidiDevices === "function") refreshMidiDevices();') >= 0);
  assert.ok(pianoSource.indexOf('case "importMidiDesktop":') >= 0);
  assert.ok(pianoSource.indexOf('if (typeof importMidiDesktopAware === "function") importMidiDesktopAware();') >= 0);
});

test("midiSettingsPage can resolve sparkCore from the global binding", function() {
  global.window = {};
  global.S = {
    midiDevices: [],
    midiProfiles: {},
    activeMidiProfileId: null
  };
  global.escHTML = function(value) { return String(value); };
  global.getActiveMidiDevice = function() { return null; };
  global.getActiveMidiProfile = function() { return null; };
  global.sparkCore = {
    getRuntimeState: function() {
      return {
        midiActiveDeviceName: "Launchkey Mini",
        midiActiveProfileName: "Stage Keys",
        midiDeviceOptions: [{ id: "dev_1", name: "Launchkey Mini" }],
        midiProfileOptions: [{ id: "profile_1", name: "Stage Keys", type: "piano" }],
        midiActiveProfileId: "profile_1"
      };
    }
  };

  global.eval(loadJS("js/midi/ui.js"));
  var html = global.window.midiSettingsPage();

  assert.ok(html.indexOf("Launchkey Mini") >= 0);
  assert.ok(html.indexOf("Stage Keys") >= 0);
  assert.ok(html.indexOf("(active)") >= 0);
});

if (process.exitCode) process.exit(process.exitCode);
