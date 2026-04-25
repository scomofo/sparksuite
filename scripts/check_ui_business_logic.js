const fs = require("fs");
const path = require("path");

function resolveUiDirs(repoRoot, env) {
  const source = env.UI_LOGIC_DIRS
    ? env.UI_LOGIC_DIRS.split(path.delimiter)
    : ["js/ui", "js/pages", "components"];
  return source.map((entry) => path.resolve(repoRoot, entry));
}

function resolveForbiddenTerms(env) {
  return env.UI_LOGIC_FORBIDDEN
    ? env.UI_LOGIC_FORBIDDEN.split(",").map((term) => term.trim()).filter(Boolean)
    : [
        "adjustDifficulty",
        "updateMastery",
        "unlockSkill",
        "addXP",
        "getNextLesson",
        "masteryDelta",
        "rewardPlan"
      ];
}

function collectViolations(options) {
  const opts = options || {};
  const repoRoot = opts.repoRoot || process.cwd();
  const fileSystem = opts.fs || fs;
  const env = opts.env || process.env;
  const uiDirs = resolveUiDirs(repoRoot, env);
  const forbidden = resolveForbiddenTerms(env);
  const violations = [];

  function walk(dir) {
    if (!fileSystem.existsSync(dir)) return;
    for (const entry of fileSystem.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = fileSystem.statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (/\.(js|ts|jsx|tsx)$/.test(full)) scanFile(full);
    }
  }

  function scanFile(file) {
    const text = fileSystem.readFileSync(file, "utf8");
    for (const term of forbidden) {
      if (text.includes(term)) {
        violations.push({
          file: path.relative(repoRoot, file),
          term
        });
      }
    }
  }

  for (const dir of uiDirs) walk(dir);

  return {
    repoRoot,
    uiDirs,
    forbidden,
    violations
  };
}

function formatScanResult(result) {
  if (!result.violations.length) {
    return {
      status: 0,
      stdout: "OK no UI business logic violations found\n",
      stderr: ""
    };
  }

  const lines = ["UI business logic violations:"];
  for (const violation of result.violations) {
    lines.push("- " + violation.file + ": " + violation.term);
  }

  return {
    status: 1,
    stdout: "",
    stderr: lines.join("\n") + "\n"
  };
}

function runScan(options) {
  return formatScanResult(collectViolations(options));
}

function runCli(options) {
  const result = runScan(options);
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result.status;
}

if (require.main === module) {
  process.exit(runCli());
}

module.exports = {
  collectViolations,
  formatScanResult,
  runScan,
  runCli
};
