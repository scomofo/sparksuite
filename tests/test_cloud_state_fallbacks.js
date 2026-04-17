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
    cloudAuth: {
      userId: "user_1",
      email: "player@sparksuite.dev",
      token: "token_abc",
      loggedIn: true
    },
    cloudProfile: {
      displayName: "Player One"
    },
    cloudSync: {
      lastSyncStatus: "ok",
      lastSyncAt: 1712102400000,
      dirtyKeys: []
    },
    cloudLastError: null,
    cloudEmailDraft: "draft@sparksuite.dev",
    cloudPasswordDraft: "secret"
  };
  global.__sparkState = null;
  global.SparkState = undefined;
  global.sparkCore = null;
  global.escHTML = function(value) { return String(value); };
  global.saveState = function() {};
  global.render = function() {};
  global.syncCloudSettingsStateRequest = function() {};
  global.applyCloudWorkflowRequest = function() {};
  global.fetchCalls = [];
  global.sparkApiRequest = async function(url, method, payload) {
    fetchCalls.push({ url: url, method: method, payload: payload || null });
    if (url === "/api/auth/login") {
      return {
        userId: "user_2",
        email: payload.email,
        token: "token_next"
      };
    }
    if (url === "/api/profile" && method === "GET") {
      return { profile: { displayName: "Cloud Name" } };
    }
    if (url === "/api/profile" && method === "POST") {
      return { profile: { displayName: payload.patch.displayName } };
    }
    if (url === "/api/sync/push") {
      return { snapshot: null };
    }
    if (url === "/api/sync/pull") {
      return {
        snapshot: {
          version: 1,
          profile: { playerXP: 200, playerLevel: 4, playerAchievements: {}, playerStats: {} },
          progression: { mastery: {}, unlocks: {}, metaProgress: {} },
          practice: { practiceHistory: [], practiceStreak: 0, lastPracticeDate: null, totalPracticeMinutes: 0 },
          planning: { weeklyPracticePlan: null, dailyChallenges: [], weeklyGoals: [] },
          editor: { editorLibrary: [], contentLibrary: {} },
          devices: { midiProfiles: {}, activeMidiProfileId: null, inputLatencyMs: 0, audioLatencyMs: 0 },
          settings: { midiRoutingMode: "default" }
        }
      };
    }
    return {};
  };
  global.isLoggedInSpark = function() {
    return !!(S.cloudAuth && S.cloudAuth.loggedIn && S.cloudAuth.token);
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

console.log("\n--- Cloud State Fallbacks ---");

async function run() {
  await test("cloud auth and profile can read and write plain global S", async function() {
    eval(loadJS("js/cloud/auth.js"));
    eval(loadJS("js/cloud/profile.js"));

    assert.strictEqual(isLoggedInSpark(), true);

    await loginSpark("next@sparksuite.dev", "pw");
    await fetchCloudProfile();
    await updateCloudProfile({ displayName: "Renamed" });
    logoutSpark();

    assert.strictEqual(S.cloudAuth.loggedIn, false);
    assert.strictEqual(S.cloudProfile.displayName, "Renamed");
    assert.strictEqual(fetchCalls[0].url, "/api/auth/login");
    assert.strictEqual(fetchCalls[1].url, "/api/profile");
    assert.strictEqual(fetchCalls[2].url, "/api/profile");
  });

  await test("cloud sync can use plain global S state", async function() {
    eval(loadJS("js/cloud/storage.js"));
    eval(loadJS("js/cloud/sync.js"));

    var synced = await syncSparkNow();
    var pulled = await pullSparkCloud();

    assert.strictEqual(synced, true);
    assert.strictEqual(pulled, true);
    assert.strictEqual(S.cloudSync.lastSyncStatus, "ok");
    assert.strictEqual(S.playerXP, 200);
    assert.strictEqual(S.level, 4);
  });

  await test("cloud settings page can render from plain global S", function() {
    eval(loadJS("js/cloud/ui.js"));

    var loggedInHtml = cloudSettingsPage();
    assert.ok(loggedInHtml.indexOf("Signed in as: player@sparksuite.dev") >= 0);
    assert.ok(loggedInHtml.indexOf("Status: ok") >= 0);

    S.cloudAuth = { userId: null, email: null, token: null, loggedIn: false };
    var loggedOutHtml = cloudSettingsPage();
    assert.ok(loggedOutHtml.indexOf("Not signed in") >= 0);
    assert.ok(loggedOutHtml.indexOf("draft@sparksuite.dev") >= 0);
  });

  await test("cloud helpers fall back to global S when SparkState.getRoot returns null", async function() {
    global.SparkState = { getRoot: function() { return null; } };
    eval(loadJS("js/cloud/auth.js"));
    eval(loadJS("js/cloud/profile.js"));
    eval(loadJS("js/cloud/storage.js"));
    eval(loadJS("js/cloud/sync.js"));
    eval(loadJS("js/cloud/ui.js"));

    await loginSpark("next@sparksuite.dev", "pw");
    assert.strictEqual(S.cloudAuth.email, "next@sparksuite.dev");
    assert.ok(cloudSettingsPage().indexOf("Signed in as: next@sparksuite.dev") >= 0);
    await syncSparkNow();
    assert.strictEqual(S.cloudSync.lastSyncStatus, "ok");
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
