const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = process.cwd();

runNode("scripts/lint_content.js");
runNode("tests/test_instrument_manager_phase_gate.js");

console.log("OK instrument contract checks passed");

function runNode(relativePath) {
  const result = spawnSync(process.execPath, [path.join(repoRoot, relativePath)], {
    cwd: repoRoot,
    stdio: "inherit"
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
