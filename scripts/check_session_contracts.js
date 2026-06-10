const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = process.cwd();

[
  "tests/test_session_plan_contracts.js",
  "tests/test_session_engine_v2.js",
  "tests/test_session_flow_end_to_end.js"
].forEach(runNode);

console.log("OK session contract checks passed");

function runNode(relativePath) {
  const result = spawnSync(process.execPath, [path.join(repoRoot, relativePath)], {
    cwd: repoRoot,
    stdio: "inherit"
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
