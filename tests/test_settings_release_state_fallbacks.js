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
    settings: {
      theme: "retro",
      uiVolume: 0.7,
      practiceReminder: true
    },
    releaseInfo: {
      version: "1.2.3",
      build: 456
    }
  };
  global.__sparkState = null;
  global.SparkState = undefined;
  global.escHTML = function(value) { return String(value); };
  global.getSettingsCategories = function() {
    return [
      { id: "display", title: "Display" },
      { id: "audio", title: "Audio" },
      { id: "practice", title: "Practice" },
      { id: "about", title: "About" }
    ];
  };
  global.document = {
    body: {
      className: "shell theme-dark",
      classList: {
        added: [],
        add: function(name) {
          this.added.push(name);
        }
      }
    }
  };
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

console.log("\n--- Settings And Release Fallbacks ---");

async function run() {
  await test("initSettingsDefaults and applyThemeSetting can use plain global S", function() {
  eval(loadJS("js/settings/settings_state.js"));

  initSettingsDefaults();
  applyThemeSetting();

  assert.strictEqual(S.settings.theme, "retro");
  assert.strictEqual(S.profile.instrumentPrimary, "guitar");
  assert.strictEqual(S.releaseInfo.version, "1.2.3");
  assert.deepStrictEqual(document.body.classList.added, ["theme-retro"]);
  });

  await test("settings page can render from plain global S", function() {
  eval(loadJS("js/settings/settings_ui.js"));

  var html = settingsPage();

  assert.ok(html.indexOf("Theme:") >= 0);
  assert.ok(html.indexOf("UI Volume: 0.7") >= 0);
  assert.ok(html.indexOf("Practice Reminder: On") >= 0);
  assert.ok(html.indexOf("Version: 1.2.3") >= 0);
  assert.ok(html.indexOf("Build: 456") >= 0);
  });

  await test("release info helpers can read and write through plain global S", async function() {
  eval(loadJS("js/release/info.js"));

  assert.strictEqual(getReleaseVersion(), "1.2.3");

  global.fetch = async function() {
    return {
      json: async function() {
        return { version: "2.0.0", build: 999 };
      }
    };
  };

  await loadReleaseInfo();

  assert.strictEqual(S.releaseInfo.version, "2.0.0");
  assert.strictEqual(S.releaseInfo.build, 999);
  assert.strictEqual(getReleaseVersion(), "2.0.0");
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
