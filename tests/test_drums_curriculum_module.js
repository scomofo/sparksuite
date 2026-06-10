const assert = require("assert");
const fs = require("fs");
const path = require("path");

global.window = global;

function load(file) {
  const full = path.join(__dirname, "..", file);
  assert(fs.existsSync(full), `${file} must exist`);
  eval(fs.readFileSync(full, "utf8"));
}

[
  "js/sparksuite/instruments/drums/drums_skill_tree.js",
  "js/sparksuite/instruments/drums/drums_curriculum.js",
  "js/sparksuite/instruments/drums/drums_lessons.js",
  "js/sparksuite/instruments/drums/drums_exercises.js",
  "js/sparksuite/instruments/drums/drums_patterns.js",
  "js/sparksuite/instruments/drums/drums_songs.js",
  "js/sparksuite/instruments/drums/drums_kits.js",
  "js/sparksuite/instruments/drums/drums_mapping.js",
  "js/sparksuite/instruments/drums/drums_notation.js",
  "js/sparksuite/instruments/drums/drums_progression.js",
  "js/sparksuite/instruments/drums/drums_packs.js",
  "js/sparksuite/instruments/drums/drums_chart_library.js",
  "js/sparksuite/instruments/drums/drums_runtime_adapter.js",
  "js/sparksuite/instruments/drums/drums_rhythm_adapter.js",
  "js/sparksuite/instruments/drums/drums_module.js",
  "js/sparksuite/instruments/drums/drums_adapter.js",
  "js/sparksuite/instruments/drums/index.js"
].forEach(load);

const requiredIds = [
  "lesson_drums_kit_orientation_01",
  "lesson_drums_count_quarters_01",
  "lesson_drums_single_strokes_01",
  "lesson_drums_metronome_lock_01",
  "lesson_drums_kick_control_01",
  "lesson_drums_basic_backbeat_01",
  "lesson_drums_hat_eighths_01",
  "lesson_drums_snare_backbeat_01",
  "lesson_drums_one_bar_fill_01",
  "lesson_drums_full_song_easy_01",
  "lesson_drums_performance_set_01",
  "ex_drums_lane_tap_01",
  "ex_drums_basic_backbeat_01",
  "drill_drums_backbeat_4bar_01",
  "drill_drums_section_switch_01",
  "pattern_drums_basic_backbeat_01",
  "pattern_drums_fill_quarters_01",
  "song_drums_first_rock_beat_01",
  "pack_drums_beginner_foundations_01",
  "pack_drums_first_grooves_01",
  "pack_drums_fills_and_transitions_01"
];

assert(global.SparkDrumsModule, "SparkDrumsModule must be defined");
assert.strictEqual(SparkSuiteInstrumentAdapters.drums().getType(), "drums");

const lessons = SparkDrumsModule.getLessons();
const lessonIds = lessons.map((lesson) => lesson.id);
requiredIds.filter((id) => id.startsWith("lesson_")).forEach((id) => {
  assert(lessonIds.includes(id), `missing lesson ${id}`);
});

const skillIds = SparkDrumsModule.getSkillTree().map((skill) => skill.id);
lessons.forEach((lesson) => {
  assert(skillIds.includes(lesson.skill), `${lesson.id} references unknown skill ${lesson.skill}`);
  (lesson.prerequisites || []).forEach((prereq) => {
    assert(skillIds.includes(prereq) || lessonIds.includes(prereq), `${lesson.id} has unknown prereq ${prereq}`);
  });
});

const exercises = SparkDrumsModule.getExercises();
const exerciseIds = exercises.map((exercise) => exercise.id);
requiredIds.filter((id) => id.startsWith("ex_") || id.startsWith("drill_")).forEach((id) => {
  assert(exerciseIds.includes(id), `missing exercise ${id}`);
});

const patterns = SparkDrumsModule.getPatterns();
requiredIds.filter((id) => id.startsWith("pattern_")).forEach((id) => {
  assert(patterns[id], `missing pattern ${id}`);
  assert(patterns[id].events.length > 0, `${id} must have playable events`);
});

const songs = SparkDrumsModule.getSongs();
const songIds = songs.map((song) => song.id);
requiredIds.filter((id) => id.startsWith("song_")).forEach((id) => {
  assert(songIds.includes(id), `missing song ${id}`);
});

const packs = SparkDrumsModule.getPacks();
const packIds = packs.map((pack) => pack.id);
requiredIds.filter((id) => id.startsWith("pack_")).forEach((id) => {
  assert(packIds.includes(id), `missing pack ${id}`);
});
packs.forEach((pack) => {
  (pack.lessonIds || []).forEach((id) => assert(lessonIds.includes(id), `${pack.id} references missing lesson ${id}`));
  (pack.exerciseIds || []).forEach((id) => assert(exerciseIds.includes(id), `${pack.id} references missing exercise ${id}`));
});

const mapping = SparkDrumsModule.getInputMapping();
assert.deepStrictEqual(mapping.primaryKeys, { kick: "A", snare: "S", hi_hat_closed: "D", aux: "F" });
assert.deepStrictEqual(mapping.gmMidi.kick, [35, 36]);
assert.strictEqual(mapping.gmMidi.hi_hat_open[0], 46);
assert.strictEqual(mapping.semanticToLane.ride, "aux");

const notation = SparkDrumsModule.getNotation();
assert.strictEqual(notation.lanes[0].id, "kick");
assert(notation.symbols.hi_hat_open);

const progression = SparkDrumsModule.getProgressionRules();
assert(progression.masteryWeights.timing >= 0.3);
assert.strictEqual(typeof progression.applyDrumResultToMastery, "function");
const mastery = progression.applyDrumResultToMastery("basic_backbeat", {
  gameplay: { accuracy: 0.82, maxCombo: 12 },
  learning: { weakAreas: ["late"] }
});
assert.strictEqual(mastery.skillId, "basic_backbeat");
assert(mastery.delta > 0);

const runtimeAdapter = SparkDrumsModule.getRuntimeAdapter();
const payload = runtimeAdapter.createPayload({
  curriculum: { nextLessonId: "lesson_drums_basic_backbeat_01" }
});
assert.strictEqual(payload.adapterType, "drums");
assert.strictEqual(payload.laneCount, 4);
assert.deepStrictEqual(payload.laneLabels, ["Kick", "Snare", "Hat", "Aux"]);
assert.strictEqual(payload.chartId, "drums_basic_backbeat_01");
assert(payload.songChart.tracks.guitar.notes.length >= 8);

console.log("test_drums_curriculum_module passed");
