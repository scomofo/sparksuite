#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const TRACKS_DIR = path.join(ROOT, "curriculum", "v2", "tracks");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const files = fs.readdirSync(TRACKS_DIR).filter((name) => name.endsWith(".json"));
let checked = 0;

files.forEach((name) => {
  const track = readJson(path.join(TRACKS_DIR, name));
  const sessions = Array.isArray(track.sessions) ? track.sessions : [];
  sessions.forEach((session) => {
    checked += 1;
    if (Number(session.novelty_count) > 1) {
      fail(session.id + " exceeds novelty_count cap: " + session.novelty_count);
    }
    const elements = Array.isArray(session.new_elements) ? session.new_elements : [];
    if (elements.length !== Number(session.novelty_count || 0)) {
      fail(session.id + " has novelty_count/new_elements mismatch");
    }
  });
});

console.log("Novelty counts OK across", checked, "sessions.");
