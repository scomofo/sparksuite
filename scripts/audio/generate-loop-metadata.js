#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const CURRICULUM_ROOT = path.join(ROOT, "curriculum", "v2", "activities");
const OUTPUT = path.join(ROOT, "assets", "audio", "common", "loop-metadata.generated.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

function main() {
  const files = fs.readdirSync(CURRICULUM_ROOT).filter((name) => name.endsWith(".activities.json"));
  const loops = [];

  files.forEach((name) => {
    const bundle = readJson(path.join(CURRICULUM_ROOT, name));
    const activities = Array.isArray(bundle.activities) ? bundle.activities : [];
    activities.forEach((activity) => {
      if (!activity || !activity.audio || !activity.audio.backing_track) return;
      loops.push({
        loop_id: slugify(activity.focus_song || activity.id),
        activity_id: activity.id,
        session_id: activity.session_id,
        instrument: activity.instrument,
        backing_track: activity.audio.backing_track,
        tempo_bpm: activity.audio.tempo_bpm || null,
        key: activity.audio.key || null,
        loop: activity.audio.loop !== false,
        duration_sec: activity.duration_sec || null,
        focus_song: activity.focus_song || ""
      });
    });
  });

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify({
    version: "2026-04-24",
    generated_at: new Date().toISOString(),
    loop_count: loops.length,
    loops: loops
  }, null, 2) + "\n", "utf8");

  console.log("Generated loop metadata:", OUTPUT);
  console.log("Loop entries:", loops.length);
}

main();
