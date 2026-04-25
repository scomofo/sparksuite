const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = process.cwd();

[
  "scripts/lint_content.js",
  "scripts/lint/validate-curriculum.js",
  "scripts/lint/check-novelty-counts.js"
].forEach(runNode);

console.log("OK content contract checks passed");

function runNode(relativePath) {
  const result = spawnSync(process.execPath, [path.join(repoRoot, relativePath)], {
    cwd: repoRoot,
    stdio: "inherit"
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
