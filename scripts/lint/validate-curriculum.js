#!/usr/bin/env node
const cp = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");

function run(relativePath) {
  cp.execFileSync(process.execPath, [path.join(ROOT, relativePath)], {
    stdio: "inherit"
  });
}

run(path.join("tests", "test_curriculum_guardrails.js"));
run(path.join("tests", "test_curriculum_v2_data.js"));

