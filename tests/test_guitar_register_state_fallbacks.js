var assert = require("assert");
var fs = require("fs");
var path = require("path");
var passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log("  PASS: " + name); }
  catch (e) { failed++; console.error("  FAIL: " + name + "\n    " + e.message); }
}

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function resetState() {
  global.window = global;
  global.S = {
    level: 1,
    completedLessons: [],
    mastery: { capo: {} }
  };
  global.__sparkState = global.S;
  global.SparkState = undefined;
  global.SparkHighway = { GUITAR_SKIN: { laneCount: 6 } };
  global.SparkProfile = {
    createEmpty: function() {
      return {
        schemaVersion: 1,
        suite: "spark",
        userId: "local-user",
        apps: {},
        suiteRewards: { badges: [], cosmetics: [], challengeProgress: {} }
      };
    },
    ensureApp: function(profile, appId, instrument) {
      profile.apps = profile.apps || {};
      if (!profile.apps[appId]) {
        profile.apps[appId] = { instrument: instrument, stats: { level: 1, xp: 0, streakDays: 0 } };
      }
    }
  };
  global.SparkStorage = { load: function() { return SparkProfile.createEmpty(); }, save: function() {} };
  global.SparkInstruments = {
    _all: [],
    register: function(module) { this._all.push(module); },
    getAll: function() { return this._all.slice(); }
  };
  global.buildSkillTree = function() { return { branches: [] }; };
  global.guitarAct = function() {};
  global.GUITAR_PAGES = {};
}

console.log("\n--- Guitar Register State Fallbacks ---\n");

test("capo progress under nested plain global S exposes capo curriculum without SparkState", function() {
  resetState();
  eval(loadJS("js/data.js"));
  eval(loadJS("js/instruments/guitar/capo.js"));
  eval(loadJS("js/instruments/guitar/register.js"));

  var guitar = SparkInstruments.getAll().filter(function(inst) {
    return inst.id === "chordspark";
  })[0];

  assert.ok(guitar, "guitar register not found");
  S.level = 1;
  S.mastery = { capo: { capo_basics: 45 } };

  var curriculum = guitar.getCurriculumMap();

  assert.ok(Array.isArray(curriculum));
  assert.ok(curriculum.length > 0, "expected capo lessons to unlock from nested capo mastery");
  assert.strictEqual(curriculum[0].id, "capo_L1");
  assert.strictEqual(curriculum[0].skill, "capo_basics");
});

console.log("\n" + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
