const { execFileSync } = require("child_process");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");

const requiredTests = [
  "tests/test_session_plan_contracts.js",
  "tests/test_execution_gateway.js",
  "tests/test_curriculum_practice_engine_contracts.js",
  "tests/test_gameplay_timing_contracts.js",
  "tests/test_progress_psychology_contracts.js",
  "tests/test_session_flow_end_to_end.js"
];

for (const testFile of requiredTests) {
  execFileSync("node", [testFile], {
    cwd: repoRoot,
    stdio: "inherit"
  });
}

console.log("SparkSuite handoff phase gate passed.");
