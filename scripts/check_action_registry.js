const fs = require("fs");
const path = require("path");
const assert = require("assert");

const repoRoot = process.cwd();
const registry = require(path.join(repoRoot, "js/sparksuite/core/action_registry.js"));
const gateway = require(path.join(repoRoot, "js/sparksuite/core/execution_gateway.js"));

const requiredActions = [
  "practice.start",
  "practice.complete",
  "practice.restart",
  "practice.openStats",
  "session.start",
  "session.complete",
  "instrument.select",
  "lesson.open",
  "exercise.start",
  "exercise.complete"
];

const rawActionExecuteMatches = [];
const knownActions = registry.listKnownSparkActions();

requiredActions.forEach((action) => {
  assert.strictEqual(registry.isKnownSparkAction(action), true, `Missing required action: ${action}`);
});

gateway.clearHandlers();
gateway.installDefaultHandlers({ force: true });

[
  "practice.start",
  "song.start",
  "challenge.start",
  "session.segment.start",
  "session.segment.practice",
  "session.segment.song",
  "session.segment.challenge"
].forEach((action) => {
  assert.ok(
    typeof gateway.getRegisteredHandler(action) === "function",
    `Expected default handler for ${action}`
  );
});

walk(path.join(repoRoot, "js"));
rawActionExecuteMatches.forEach((match) => {
  assert.ok(
    knownActions.indexOf(match.action) >= 0,
    `Unknown raw execute action "${match.action}" in ${match.file}`
  );
});

console.log("OK action registry contracts verified");

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      return;
    }
    if (!/\.(js|ts|jsx|tsx)$/.test(entry.name)) return;
    scanFile(full);
  });
}

function scanFile(file) {
  const relativeFile = path.relative(repoRoot, file);
  if (
    relativeFile === path.join("js", "sparksuite", "core", "execution_gateway.js") ||
    relativeFile === path.join("js", "sparksuite", "core", "action_registry.js")
  ) {
    return;
  }
  const text = fs.readFileSync(file, "utf8");
  const patterns = [
    /(?:gateway|SparkExecutionGateway)\.execute\(\s*["']([^"']+)["']/g,
    /execute\(\s*["']([^"']+\.[^"']+)["']/g
  ];
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text))) {
      rawActionExecuteMatches.push({
        file: relativeFile,
        action: match[1]
      });
    }
  });
}
