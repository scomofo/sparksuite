const assert = require("assert");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const gateScriptPath = path.join(repoRoot, "scripts", "lint", "check-handoff-phase-gate.js");
const gateScriptSource = fs.readFileSync(gateScriptPath, "utf8");

function test(name, fn) {
  try {
    fn();
    console.log("PASS:", name);
  } catch (error) {
    console.error("FAIL:", name, "--", error.message);
    process.exitCode = 1;
  }
}

test("package.json exposes a handoff phase gate script", function() {
  assert.strictEqual(
    packageJson.scripts["handoff:phase-gate"],
    "node scripts/lint/check-handoff-phase-gate.js"
  );
});

test("handoff phase gate script exists", function() {
  assert.ok(fs.existsSync(gateScriptPath));
});

test("handoff phase gate runs the required contract suites", function() {
  [
    "tests/test_session_plan_contracts.js",
    "tests/test_execution_gateway.js",
    "tests/test_curriculum_practice_engine_contracts.js",
    "tests/test_gameplay_timing_contracts.js",
    "tests/test_progress_psychology_contracts.js",
    "tests/test_session_flow_end_to_end.js"
  ].forEach(function(testFile) {
    assert.ok(
      gateScriptSource.includes(testFile),
      "gate script should include " + testFile
    );
  });
});
