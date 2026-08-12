const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CURRICULUM_ROOT = path.join(ROOT, "curriculum", "v2");
const TRACKS = ["guitar", "bass", "piano", "ukulele"];
const ALLOWED_COMPLETION_TYPES = new Set(["self_report", "timed", "count", "audio_match", "record_save"]);
const EXPECTED_BLOCKS = ["warm_engine", "drill", "song", "cooldown"];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(CURRICULUM_ROOT, relativePath), "utf8"));
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

function evalFile(relativePath) {
  const source = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
  global.window = global;
  global.S = global.S || {};
  eval(source);
}

console.log("\n--- Curriculum V2 Data ---");

test("catalog file exists and declares four tracks", function() {
  const catalog = readJson("catalog.json");
  assert.strictEqual(catalog.format, "sparksuite-curriculum-v2");
  assert.ok(Array.isArray(catalog.tracks));
  assert.strictEqual(catalog.tracks.length, 4);
});

test("generated browser data file exists", function() {
  assert.ok(fs.existsSync(path.join(ROOT, "js", "curriculum", "curriculum_v2_data.generated.js")));
});

test("browser helper exposes next session summaries", function() {
  evalFile(path.join("js", "curriculum", "curriculum_v2_data.generated.js"));
  evalFile(path.join("js", "curriculum", "curriculum_v2.js"));
  evalFile(path.join("js", "curriculum", "curriculum_v2_legacy_adapter.js"));
  assert.ok(global.SparkCurriculumV2);
  assert.ok(global.SparkCurriculumV2LegacyAdapter);
  const summary = global.SparkCurriculumV2.getTrackSummary("guitar");
  assert.ok(summary);
  assert.strictEqual(summary.sessionCount, 30);
  assert.ok(summary.nextSession);
  assert.strictEqual(summary.nextSession.id, "gtr-d01");
  const activities = global.SparkCurriculumV2.getSessionActivities("guitar", "gtr-d01");
  assert.strictEqual(activities.length, 4);
  assert.strictEqual(activities[0].id, "gtr-d01-warm_engine");
  assert.ok(activities[0].copy.setup.indexOf("warm engine block") >= 0);
  const songActivity = global.SparkCurriculumV2.getActivity("guitar", "gtr-d01-song");
  assert.ok(songActivity);
  assert.strictEqual(songActivity.block_type, "song");
  const legacyLessons = global.SparkCurriculumV2LegacyAdapter.toLegacyLessons("guitar");
  assert.strictEqual(legacyLessons.length, 30);
  assert.strictEqual(legacyLessons[0].id, "gtr-d01");
  assert.strictEqual(legacyLessons[0].num, 1);
  assert.strictEqual(legacyLessons[0].source, "curriculum-v2");
});

TRACKS.forEach((instrument) => {
  test(`${instrument}: track file exists`, function() {
    assert.ok(fs.existsSync(path.join(CURRICULUM_ROOT, "tracks", `${instrument}-30day.json`)));
  });

  test(`${instrument}: activity file exists`, function() {
    assert.ok(fs.existsSync(path.join(CURRICULUM_ROOT, "activities", `${instrument}-30day.activities.json`)));
  });

  test(`${instrument}: has exactly 30 ordered sessions`, function() {
    const track = readJson(`tracks/${instrument}-30day.json`);
    assert.strictEqual(track.session_count, 30);
    assert.strictEqual(track.sessions.length, 30);
    track.sessions.forEach((session, index) => {
      assert.strictEqual(session.day, index + 1);
    });
  });

  test(`${instrument}: sessions respect novelty cap and shell structure`, function() {
    const track = readJson(`tracks/${instrument}-30day.json`);
    track.sessions.forEach((session) => {
      assert.ok(session.novelty_count <= 1, `${session.id} exceeds novelty cap`);
      assert.ok(Array.isArray(session.new_elements), `${session.id} missing new_elements`);
      assert.strictEqual(session.new_elements.length, session.novelty_count, `${session.id} mismatch between novelty_count and new_elements`);
      assert.strictEqual(session.target_duration_min, 10, `${session.id} target_duration_min should be 10`);
      assert.strictEqual(session.blocks.length, 4, `${session.id} must have four blocks`);
      assert.deepStrictEqual(session.blocks.map((block) => block.type), EXPECTED_BLOCKS, `${session.id} has wrong block ordering`);
      session.blocks.forEach((block) => {
        assert.ok(block.activity_id, `${session.id} has block without activity id`);
        assert.ok(block.duration_sec > 0, `${session.id} has non-positive block duration`);
      });
      assert.ok(ALLOWED_COMPLETION_TYPES.has(session.completion_criteria.type), `${session.id} invalid completion type`);
    });
  });

  test(`${instrument}: session IDs and activity IDs are unique and linked`, function() {
    const track = readJson(`tracks/${instrument}-30day.json`);
    const activityBundle = readJson(`activities/${instrument}-30day.activities.json`);
    const sessionIds = new Set();
    const activityIds = new Set(activityBundle.activities.map((activity) => activity.id));

    track.sessions.forEach((session) => {
      assert.ok(!sessionIds.has(session.id), `duplicate session id ${session.id}`);
      sessionIds.add(session.id);
      session.blocks.forEach((block) => {
        assert.ok(activityIds.has(block.activity_id), `${session.id} references missing activity ${block.activity_id}`);
      });
      if (session.day === 1) {
        assert.deepStrictEqual(session.prerequisites, []);
      } else {
        assert.strictEqual(session.prerequisites.length, 1, `${session.id} should depend on prior day`);
      }
    });

    assert.strictEqual(activityBundle.activity_count, 120);
    assert.strictEqual(activityBundle.activities.length, 120);
  });

  test(`${instrument}: focus_song_id is present, well-formed, and mirrored onto activities`, function() {
    const track = readJson(`tracks/${instrument}-30day.json`);
    const activityBundle = readJson(`activities/${instrument}-30day.activities.json`);
    const sessionSongIds = {};

    track.sessions.forEach((session) => {
      assert.ok(
        Object.prototype.hasOwnProperty.call(session, "focus_song_id"),
        `${session.id} missing focus_song_id field`
      );
      if (session.focus_song_id !== null) {
        assert.strictEqual(typeof session.focus_song_id, "string");
        assert.ok(
          /^[a-z0-9]+(_[a-z0-9]+)*$/.test(session.focus_song_id),
          `${session.id} focus_song_id "${session.focus_song_id}" is not a canonical song slug`
        );
      }
      sessionSongIds[session.id] = session.focus_song_id;
    });

    activityBundle.activities.forEach((activity) => {
      assert.strictEqual(
        activity.focus_song_id,
        sessionSongIds[activity.session_id],
        `${activity.id} focus_song_id diverges from its session`
      );
    });
  });
});

test("known curriculum-to-song joins are stamped", function() {
  const expectations = [
    ["guitar", "gtr-d16", "knockin_on_heavens_door"],
    ["guitar", "gtr-d02", "horse_with_no_name"], // "same" carries day 1's song forward
    ["bass", "bass-d07", "seven_nation_army"],
    ["piano", "pno-d15", "let_it_be"],
    ["ukulele", "uke-d15", "riptide"],
    ["guitar", "gtr-d20", "mad_world"],
    ["piano", "pno-d02", "ode_to_joy"],
    ["ukulele", "uke-d21", "three_little_birds"],
    ["ukulele", "uke-d13", "you_are_my_sunshine"],
    ["guitar", "gtr-d12", null] // "user picks" stays unresolved
  ];
  expectations.forEach(([instrument, sessionId, expected]) => {
    const track = readJson(`tracks/${instrument}-30day.json`);
    const session = track.sessions.find((row) => row.id === sessionId);
    assert.ok(session, `${sessionId} not found`);
    assert.strictEqual(session.focus_song_id, expected, `${sessionId} focus_song_id`);
  });
});

if (process.exitCode) process.exit(process.exitCode);
