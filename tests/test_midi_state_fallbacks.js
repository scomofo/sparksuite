var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.S = {
    midiDevices: [],
    midiProfiles: {},
    activeMidiDeviceId: null,
    activeMidiProfileId: null,
    inputLatencyMs: 12
  };
  global.__sparkState = null;
  global.SparkState = undefined;
  Object.defineProperty(global, "navigator", {
    value: undefined,
    writable: true,
    configurable: true
  });
  global.escHTML = function(value) { return String(value); };
  global.saveState = function() {};
  global.syncMidiSettingsStateCalls = [];
  global.syncMidiSettingsStateRequest = function() {
    syncMidiSettingsStateCalls.push(true);
  };
  global.generateIdCounter = 0;
  global.generateId = function(prefix) {
    generateIdCounter += 1;
    return String(prefix || "id") + "_" + generateIdCounter;
  };
}

function nextTick() {
  return new Promise(function(resolve) {
    setTimeout(resolve, 0);
  });
}

async function test(name, fn) {
  try {
    resetState();
    await fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
  }
}

console.log("\n--- MIDI State Fallbacks ---");

async function run() {
  await test("midi device refresh can use plain global S and tolerate missing navigator", async function() {
    eval(loadJS("js/midi/devices.js"));

    refreshMidiDevices();
    assert.deepStrictEqual(S.midiDevices, []);

    Object.defineProperty(global, "navigator", {
      value: {
      requestMIDIAccess: function() {
        return Promise.resolve({
          inputs: {
            forEach: function(cb) {
              cb({ id: "dev_1", name: "Keyboard", manufacturer: "Spark", state: "connected" });
              cb({ id: "dev_2", name: "Controller", manufacturer: "Spark", state: "connected" });
            }
          }
        });
      }
      },
      writable: true,
      configurable: true
    });

    refreshMidiDevices();
    await nextTick();

    assert.strictEqual(S.midiDevices.length, 2);
    assert.strictEqual(S.activeMidiDeviceId, "dev_1");
    assert.strictEqual(getActiveMidiDevice().name, "Keyboard");
    assert.strictEqual(syncMidiSettingsStateCalls.length, 1);
  });

  await test("midi profile helpers can persist profiles into plain global S", function() {
    eval(loadJS("js/midi/profiles.js"));

    S.activeMidiDeviceId = "dev_1";
    var piano = createDefaultPianoProfile();
    var guitar = createDefaultGuitarProfile();
    setActiveMidiProfile(guitar.id);

    assert.ok(S.midiProfiles[piano.id]);
    assert.ok(S.midiProfiles[guitar.id]);
    assert.strictEqual(S.midiProfiles[piano.id].deviceId, "dev_1");
    assert.strictEqual(getActiveMidiProfile().id, guitar.id);
    assert.strictEqual(S.activeMidiProfileId, guitar.id);
  });

  await test("midi settings page can render from plain global S", function() {
    eval(loadJS("js/midi/devices.js"));
    eval(loadJS("js/midi/profiles.js"));
    eval(loadJS("js/midi/ui.js"));

    S.midiDevices = [{ id: "dev_1", name: "Keyboard" }];
    S.activeMidiDeviceId = "dev_1";
    var profile = createDefaultPianoProfile();

    var html = midiSettingsPage();

    assert.ok(html.indexOf("Active Device: Keyboard") >= 0);
    assert.ok(html.indexOf("Active Profile: " + profile.name) >= 0);
    assert.ok(html.indexOf("Available Devices") >= 0);
    assert.ok(html.indexOf("Saved Profiles") >= 0);
  });

  await test("midi helpers fall back to global S when SparkState.getRoot returns null", function() {
    global.SparkState = { getRoot: function() { return null; } };
    eval(loadJS("js/midi/devices.js"));
    eval(loadJS("js/midi/profiles.js"));
    eval(loadJS("js/midi/ui.js"));

    S.midiDevices = [{ id: "dev_1", name: "Keyboard" }];
    S.activeMidiDeviceId = "dev_1";
    createDefaultPianoProfile();
    refreshMidiDevices();
    assert.strictEqual(Array.isArray(S.midiDevices), true);
    assert.ok(midiSettingsPage().indexOf("Profile") >= 0);
  });

  if (failed) {
    process.exitCode = 1;
  } else {
    console.log("\n" + passed + " passed, 0 failed");
  }
}

run().catch(function(err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
