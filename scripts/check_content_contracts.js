const path = require("path");
const { spawnSync } = require("child_process");
const fs = require("fs");

const repoRoot = process.cwd();

[
  "scripts/lint_content.js",
  "scripts/lint/validate-curriculum.js",
  "scripts/lint/check-novelty-counts.js"
].forEach(runNode);

const contentInstrumentRoot = path.join(repoRoot, "content", "instruments");
if (fs.existsSync(contentInstrumentRoot)) {
  fs.readdirSync(contentInstrumentRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .forEach((entry) => runNode("scripts/preview_content.js", entry.name));
}

console.log("OK content contract checks passed");

function runNode(relativePath, ...args) {
  const result = spawnSync(process.execPath, [path.join(repoRoot, relativePath)].concat(args), {
    cwd: repoRoot,
    stdio: "inherit"
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
