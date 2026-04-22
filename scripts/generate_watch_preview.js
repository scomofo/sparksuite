#!/usr/bin/env node
// scripts/generate_watch_preview.js
// Watches instrument files, regenerates/applies on change, signals browser reload.
// Usage: node scripts/generate_watch_preview.js --instrument <name> [--template <type>]

var fs = require("fs");
var path = require("path");
var cp = require("child_process");

var args = process.argv.slice(2);

function getArg(flag, def) {
  var idx = args.indexOf(flag);
  return (idx >= 0 && args[idx + 1]) ? args[idx + 1] : def;
}

var instrument = getArg("--instrument", null);
var template = getArg("--template", "stringed");

if (!instrument) {
  console.log("Usage: node scripts/generate_watch_preview.js --instrument <name> [--template <type>]");
  process.exit(0);
}

var rtDir = "js/instruments/" + instrument;
var ssDir = "js/sparksuite/instruments/" + instrument;
var signalFile = "_dev_reload_signal.txt";
var debounceMs = 800;
var debounceTimer = null;

function writeSignal() {
  fs.writeFileSync(signalFile, String(Date.now()));
}

function runApply() {
  console.log("");
  console.log("[watch] Change detected, running apply...");
  try {
    cp.execSync("node scripts/apply_generated_instrument_final.js --skip-validate", { stdio: "inherit" });
    writeSignal();
    console.log("[watch] Done. Browser will reload.");
  } catch (e) {
    console.error("[watch] Apply failed: " + e.message);
  }
}

function onFileChange(eventType, filename) {
  if (!filename || !filename.endsWith(".js")) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runApply, debounceMs);
}

// Initial generate if instrument dir does not exist
if (!fs.existsSync(rtDir)) {
  console.log("[watch] Instrument not found. Generating scaffold...");
  cp.execSync("node scripts/generate_instrument_pipeline_final.js " + instrument + " --type " + template + " --apply", { stdio: "inherit" });
} else {
  // Run initial apply
  runApply();
}

// Watch directories
var watchDirs = [];
if (fs.existsSync(rtDir)) watchDirs.push(rtDir);
if (fs.existsSync(ssDir)) watchDirs.push(ssDir);

if (!watchDirs.length) {
  console.error("[watch] No directories to watch for " + instrument);
  process.exit(1);
}

watchDirs.forEach(function(dir) {
  fs.watch(dir, { recursive: true }, onFileChange);
  console.log("[watch] Watching " + dir);
});

writeSignal();
console.log("[watch] Ready. Edit instrument files to trigger rebuild + reload.");
console.log("[watch] Open app with ?dev=1 to see overlay + auto-reload.");
console.log("[watch] Press Ctrl+C to stop.");
