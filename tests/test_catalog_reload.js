var assert = require("assert");
var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;
var tests = [];

function test(name, fn) {
  tests.push({ name: name, fn: fn });
}

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

global.window = global;
global.syncCalls = 0;
global.syncCurriculumStateRequest = function() {
  syncCalls++;
};
global.sparkCore = {
  events: [],
  applyCurriculumWorkflowRequest: function(action, payload) {
    this.events.push({ action: action, payload: payload || {} });
    return payload || {};
  }
};

var responses = {
  "/content-manifest-a.json": {
    lessons: "/content-lessons-a.json",
    songs: "/content-songs-a.json",
    drills: "/content-drills-a.json",
    templates: "/content-templates-a.json",
    packs: "/content-packs-a.json"
  },
  "/content-manifest-b.json": {
    lessons: "/content-lessons-b.json",
    songs: "/content-songs-b.json",
    drills: "/content-drills-b.json",
    templates: "/content-templates-b.json",
    packs: "/content-packs-b.json"
  },
  "/content-lessons-a.json": [
    { id: "lesson_a", title: "Lesson A" }
  ],
  "/content-lessons-b.json": [],
  "/content-songs-a.json": [
    { id: "song_a", title: "Song A" }
  ],
  "/content-songs-b.json": [
    { id: "song_b", title: "Song B" }
  ],
  "/content-drills-a.json": [
    { id: "drill_a", title: "Drill A" }
  ],
  "/content-drills-b.json": [],
  "/content-templates-a.json": [
    { id: "template_a", title: "Template A" }
  ],
  "/content-templates-b.json": [],
  "/content-packs-a.json": [
    { id: "pack_a", title: "Pack A" }
  ],
  "/content-packs-b.json": [
    { id: "pack_b", title: "Pack B" }
  ],
  "/curriculum-manifest-a.json": {
    curriculums: "/curriculums-a.json",
    tracks: "/tracks-a.json",
    units: "/units-a.json",
    lessons: "/curriculum-lessons-a.json"
  },
  "/curriculum-manifest-b.json": {
    curriculums: "/curriculums-b.json",
    tracks: "/tracks-b.json",
    units: "/units-b.json",
    lessons: "/curriculum-lessons-b.json"
  },
  "/curriculums-a.json": [
    { id: "curriculum_a", title: "Curriculum A" }
  ],
  "/curriculums-b.json": [
    { id: "curriculum_b", title: "Curriculum B" }
  ],
  "/tracks-a.json": [
    { id: "track_a", title: "Track A" }
  ],
  "/tracks-b.json": [],
  "/units-a.json": [
    { id: "unit_a", title: "Unit A" }
  ],
  "/units-b.json": [
    { id: "unit_b", title: "Unit B" }
  ],
  "/curriculum-lessons-a.json": [
    { id: "curriculum_lesson_a", title: "Curriculum Lesson A" }
  ],
  "/curriculum-lessons-b.json": [],
  "/content-manifest-error.json": {
    songs: "/content-songs-error.json"
  },
  "/content-songs-error.json": {
    ok: false,
    data: { message: "missing songs payload" }
  },
  "/curriculum-manifest-error.json": {
    curriculums: "/curriculums-error-a.json",
    tracks: "/tracks-error.json"
  },
  "/curriculums-error-a.json": [
    { id: "curriculum_keep", title: "Curriculum Keep" }
  ],
  "/tracks-error.json": {
    ok: false,
    data: { message: "missing tracks payload" }
  }
};

global.fetch = function(targetPath) {
  if (!Object.prototype.hasOwnProperty.call(responses, targetPath)) {
    return Promise.reject(new Error("Unexpected fetch path: " + targetPath));
  }
  var entry = responses[targetPath];
  var ok = true;
  var data = entry;
  if (entry && typeof entry === "object" && Object.prototype.hasOwnProperty.call(entry, "ok")) {
    ok = entry.ok !== false;
    data = entry.data;
  }
  return Promise.resolve({
    ok: ok,
    json: function() {
      return Promise.resolve(clone(data));
    }
  });
};

eval(loadJS("js/content/registry.js"));
eval(loadJS("js/content/loader.js"));
eval(loadJS("js/curriculum/curriculum_registry.js"));
eval(loadJS("js/curriculum/curriculum_loader.js"));

console.log("=== Catalog Reload Tests ===");

test("registerContent replaces stale entries for a type", function() {
  registerContent("songs", [{ id: "song_a", title: "Song A" }]);
  registerContent("songs", [{ id: "song_b", title: "Song B" }]);
  assert.ok(!getContent("songs", "song_a"));
  assert.strictEqual(getContent("songs", "song_b").title, "Song B");
});

test("registerContent builds canonical song families", function() {
  registerContent("songs", [
    { id: "stand_by_me", title: "Stand By Me", artist: "Ben E. King", midi: "content/songs/midi/stand_by_me.mid" },
    { id: "la_bamba", title: "La Bamba", artist: "Ritchie Valens", familyId: "la_bamba" }
  ]);

  var standByMeFamily = getSongFamily("stand_by_me");
  assert.ok(standByMeFamily);
  assert.strictEqual(standByMeFamily.id, "stand_by_me");
  assert.strictEqual(standByMeFamily.canonicalSongId, "stand_by_me");
  assert.strictEqual(standByMeFamily.songs[0], "stand_by_me");
  assert.strictEqual(getSongFamilyVariants("stand_by_me").length, 1);
  assert.strictEqual(getContent("songs", "stand_by_me").audio.type, "midi");
  assert.strictEqual(getContent("songs", "stand_by_me").audio.src, "content/songs/midi/stand_by_me.mid");
});

test("loadAllContent treats each manifest section as authoritative", async function() {
  sparkCore.events = [];
  await loadAllContent("/content-manifest-a.json");
  await loadAllContent("/content-manifest-b.json");

  assert.ok(!getContent("songs", "song_a"));
  assert.strictEqual(getContent("songs", "song_b").title, "Song B");
  assert.ok(!getContent("lessons", "lesson_a"));
  assert.ok(!getContent("drills", "drill_a"));
  assert.ok(!getContent("templates", "template_a"));
  assert.ok(!getContent("packs", "pack_a"));
  assert.strictEqual(getContent("packs", "pack_b").title, "Pack B");
  assert.deepStrictEqual(
    sparkCore.events.map(function(entry) { return entry.action; }),
    ["content_load_start", "content_load_done", "content_load_start", "content_load_done"]
  );
});

test("loadAllContent rejects failed section fetches without partially mutating content", async function() {
  sparkCore.events = [];
  registerContent("songs", [{ id: "song_keep", title: "Song Keep" }]);

  await assert.rejects(function() {
    return loadAllContent("/content-manifest-error.json");
  }, /Content fetch failed/);

  assert.strictEqual(getContent("songs", "song_keep").title, "Song Keep");
  assert.deepStrictEqual(
    sparkCore.events.map(function(entry) { return entry.action; }),
    ["content_load_start", "content_load_error"]
  );
});

test("registerCurriculum replaces stale entries for a type", function() {
  registerCurriculum("units", [{ id: "unit_a", title: "Unit A" }]);
  registerCurriculum("units", [{ id: "unit_b", title: "Unit B" }]);
  assert.ok(!getCurriculumItem("units", "unit_a"));
  assert.strictEqual(getCurriculumItem("units", "unit_b").title, "Unit B");
});

test("loadCurriculumManifest treats each manifest section as authoritative", async function() {
  sparkCore.events = [];
  await loadCurriculumManifest("/curriculum-manifest-a.json");
  await loadCurriculumManifest("/curriculum-manifest-b.json");

  assert.ok(!getCurriculumItem("curriculums", "curriculum_a"));
  assert.strictEqual(getCurriculumItem("curriculums", "curriculum_b").title, "Curriculum B");
  assert.ok(!getCurriculumItem("tracks", "track_a"));
  assert.ok(!getCurriculumItem("units", "unit_a"));
  assert.strictEqual(getCurriculumItem("units", "unit_b").title, "Unit B");
  assert.ok(!getCurriculumItem("lessons", "curriculum_lesson_a"));
  assert.deepStrictEqual(
    sparkCore.events.map(function(entry) { return entry.action; }),
    ["curriculum_load_start", "curriculum_load_done", "curriculum_load_start", "curriculum_load_done"]
  );
});

test("loadCurriculumManifest rejects failed section fetches without partially mutating curriculum", async function() {
  sparkCore.events = [];
  registerCurriculum("curriculums", [{ id: "curriculum_keep", title: "Curriculum Keep" }]);
  registerCurriculum("tracks", [{ id: "track_keep", title: "Track Keep" }]);

  await assert.rejects(function() {
    return loadCurriculumManifest("/curriculum-manifest-error.json");
  }, /Curriculum fetch failed/);

  assert.strictEqual(getCurriculumItem("curriculums", "curriculum_keep").title, "Curriculum Keep");
  assert.strictEqual(getCurriculumItem("tracks", "track_keep").title, "Track Keep");
  assert.deepStrictEqual(
    sparkCore.events.map(function(entry) { return entry.action; }),
    ["curriculum_load_start", "curriculum_load_error"]
  );
});

async function run() {
  for (var i = 0; i < tests.length; i++) {
    try {
      await tests[i].fn();
      passed++;
      console.log("  PASS: " + tests[i].name);
    } catch (err) {
      failed++;
      console.error("  FAIL: " + tests[i].name);
      console.error("    " + err.message);
    }
  }

  console.log("\n" + passed + " passed, " + failed + " failed");
  if (failed > 0) process.exit(1);
}

run();
