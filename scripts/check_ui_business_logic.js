const fs = require("fs");
const path = require("path");

/*
 * Guards CLAUDE.md's non-negotiable rule: engine-owned decisions (difficulty,
 * mastery, unlocks, XP, lesson choice, reward shape) must live in the engine
 * tree, not in pages, actions, helpers, or instrument apps.
 *
 * Scope: everything under js/ EXCEPT the allowlisted engine tree. The scan
 * used to cover only js/ui, js/pages and components — which excluded
 * js/actions, js/utils, js/instruments, js/meta, js/progression, js/timers.js,
 * js/state.js and js/ui.js (a file, not the js/ui/ directory), i.e. most of
 * the code that actually owns UI-adjacent decisions.
 *
 * Matching is identifier-aware, not substring-based. A term is a violation
 * when it appears OUTSIDE the engine tree as either:
 *   - a definition        function addXP(...)  /  addXP: function  /  addXP = function
 *   - a bare global call   addXP(5)
 * but NOT as a member call (sparkCore.addXP(5), SparkProgress.awardXp(...)),
 * which is the sanctioned way for UI code to reach an engine.
 *
 * Comments and string literals are stripped before matching, so prose and
 * documentation referencing a term never trip the scan.
 */

const DEFAULT_SCAN_DIRS = ["js"];

// Paths whose contents are allowed to own these decisions, or which are not
// hand-written source at all.
const DEFAULT_ALLOW_PREFIXES = [
  "js/sparksuite", // the engine tree — this is where the logic belongs
  "js/spark-highway.js", // vendored minified PixiJS renderer bundle
  // SparkCurriculumService is a real engine ("Service wrapper for engine-first
  // architecture (Phase 5)") that simply has not been relocated under
  // js/sparksuite/ yet. It owns lesson choice legitimately; flagging it as
  // UI logic would be a miscategorisation. Remove this entry when it moves.
  "js/curriculum/curriculum_engine.js"
];

const DEFAULT_BASELINE_PATH = "scripts/ui_business_logic_baseline.json";

const DEFAULT_FORBIDDEN_TERMS = [
  "adjustDifficulty",
  "updateMastery",
  "unlockSkill",
  "addXP",
  "getNextLesson",
  "masteryDelta",
  "rewardPlan"
];

function splitList(value, separator) {
  return value
    .split(separator)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function resolveScanDirs(repoRoot, env) {
  const source = env.UI_LOGIC_DIRS
    ? splitList(env.UI_LOGIC_DIRS, path.delimiter)
    : DEFAULT_SCAN_DIRS;
  return source.map((entry) => path.resolve(repoRoot, entry));
}

function resolveAllowPrefixes(env) {
  // An explicit UI_LOGIC_DIRS run (used by tests against a temp tree) gets no
  // implicit allowlist — the caller is scoping the scan itself.
  if (env.UI_LOGIC_ALLOW) return splitList(env.UI_LOGIC_ALLOW, path.delimiter);
  if (env.UI_LOGIC_DIRS) return [];
  return DEFAULT_ALLOW_PREFIXES;
}

function resolveForbiddenTerms(env) {
  return env.UI_LOGIC_FORBIDDEN
    ? splitList(env.UI_LOGIC_FORBIDDEN, ",")
    : DEFAULT_FORBIDDEN_TERMS;
}

/*
 * Blank out comments and string/template literals so only real code is
 * matched. Characters are replaced with spaces rather than deleted so that
 * line numbers and offsets stay accurate for reporting.
 */
function stripCommentsAndStrings(text) {
  const out = text.split("");
  const len = text.length;
  let i = 0;

  function blank(from, to) {
    for (let k = from; k < to && k < len; k++) {
      if (out[k] !== "\n") out[k] = " ";
    }
  }

  while (i < len) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === "/" && next === "/") {
      let end = text.indexOf("\n", i);
      if (end === -1) end = len;
      blank(i, end);
      i = end;
      continue;
    }

    if (ch === "/" && next === "*") {
      let end = text.indexOf("*/", i + 2);
      end = end === -1 ? len : end + 2;
      blank(i, end);
      i = end;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      let j = i + 1;
      while (j < len) {
        if (text[j] === "\\") {
          j += 2;
          continue;
        }
        if (text[j] === quote) break;
        // An unterminated single/double quote ends at the newline; treating it
        // as running to EOF would blank the rest of the file.
        if (quote !== "`" && text[j] === "\n") break;
        j += 1;
      }
      blank(i, Math.min(j + 1, len));
      i = Math.min(j + 1, len);
      continue;
    }

    i += 1;
  }

  return out.join("");
}

function buildTermPatterns(term) {
  const t = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [
    // Bare (non-member) call or function declaration: addXP(  /  function addXP(
    { kind: "bare call or declaration", re: new RegExp("(^|[^.\\w$])" + t + "\\s*\\(", "m") },
    // Property or variable definition: addXP: function  /  addXP = function  /  addXP: (a) =>
    { kind: "definition", re: new RegExp("(^|[^.\\w$])" + t + "\\s*[:=]\\s*(async\\s+)?(function\\b|\\()", "m") }
  ];
}

function isAllowed(relPath, allowPrefixes) {
  const normalized = relPath.split(path.sep).join("/");
  return allowPrefixes.some(
    (prefix) => normalized === prefix || normalized.startsWith(prefix.replace(/\/$/, "") + "/")
  );
}

function collectViolations(options) {
  const opts = options || {};
  const repoRoot = opts.repoRoot || process.cwd();
  const fileSystem = opts.fs || fs;
  const env = opts.env || process.env;
  const scanDirs = resolveScanDirs(repoRoot, env);
  const allowPrefixes = resolveAllowPrefixes(env);
  const forbidden = resolveForbiddenTerms(env);
  const patterns = forbidden.map((term) => ({ term, tests: buildTermPatterns(term) }));
  const violations = [];

  function walk(dir) {
    if (!fileSystem.existsSync(dir)) return;
    for (const entry of fileSystem.readdirSync(dir).sort()) {
      const full = path.join(dir, entry);
      if (fileSystem.statSync(full).isDirectory()) walk(full);
      else if (/\.(js|ts|jsx|tsx)$/.test(full) && !/\.generated\.js$/.test(full)) scanFile(full);
    }
  }

  function scanFile(file) {
    const relPath = path.relative(repoRoot, file);
    if (isAllowed(relPath, allowPrefixes)) return;

    const code = stripCommentsAndStrings(fileSystem.readFileSync(file, "utf8"));
    const lines = code.split("\n");

    for (const { term, tests } of patterns) {
      for (let i = 0; i < lines.length; i++) {
        const match = tests.find((t) => t.re.test(lines[i]));
        if (!match) continue;
        violations.push({
          file: relPath.split(path.sep).join("/"),
          line: i + 1,
          term,
          kind: match.kind
        });
        break; // one report per term per file is enough to act on
      }
    }
  }

  for (const dir of scanDirs) walk(dir);

  violations.sort((a, b) => a.file.localeCompare(b.file) || a.term.localeCompare(b.term));

  /*
   * Baseline ratchet. Widening this scan surfaced pre-existing violations;
   * failing the build on all of them outright would just get the check
   * reverted. Instead the known set is recorded in a checked-in baseline:
   * anything new fails, and an entry that has been fixed also fails so the
   * baseline is forced to shrink rather than rot. Set UI_LOGIC_NO_BASELINE=1
   * to see the raw list.
   */
  const key = (v) => v.file + "::" + v.term;
  let baseline = [];
  if (!env.UI_LOGIC_NO_BASELINE && !env.UI_LOGIC_DIRS) {
    const baselinePath = path.resolve(repoRoot, env.UI_LOGIC_BASELINE || DEFAULT_BASELINE_PATH);
    if (fileSystem.existsSync(baselinePath)) {
      const parsed = JSON.parse(fileSystem.readFileSync(baselinePath, "utf8"));
      baseline = Array.isArray(parsed.knownViolations) ? parsed.knownViolations : [];
    }
  }
  const baselineKeys = new Set(baseline.map((entry) => entry.file + "::" + entry.term));
  const seenKeys = new Set(violations.map(key));

  const newViolations = violations.filter((v) => !baselineKeys.has(key(v)));
  const baselined = violations.filter((v) => baselineKeys.has(key(v)));
  const staleBaseline = baseline.filter((entry) => !seenKeys.has(entry.file + "::" + entry.term));

  return {
    repoRoot,
    scanDirs,
    uiDirs: scanDirs,
    allowPrefixes,
    forbidden,
    violations: newViolations,
    baselined,
    staleBaseline,
    allViolations: violations
  };
}

function formatScanResult(result) {
  const baselined = result.baselined || [];
  const stale = result.staleBaseline || [];

  if (!result.violations.length && !stale.length) {
    const note = baselined.length
      ? "OK no new UI business logic violations (" +
        baselined.length +
        " known, see " +
        DEFAULT_BASELINE_PATH +
        ")\n"
      : "OK no UI business logic violations found\n";
    return { status: 0, stdout: note, stderr: "" };
  }

  const lines = [];

  if (result.violations.length) {
    lines.push("UI business logic violations (" + result.violations.length + "):");
    lines.push("");
    lines.push("Engine-owned decisions must live in the engine tree. Each entry below");
    lines.push("defines or calls one of these as a bare global outside it.");
    let lastFile = null;
    for (const violation of result.violations) {
      if (violation.file !== lastFile) {
        lines.push("");
        lines.push(violation.file);
        lastFile = violation.file;
      }
      lines.push("  " + violation.line + ": " + violation.term + "  (" + violation.kind + ")");
    }
  }

  if (stale.length) {
    if (lines.length) lines.push("");
    lines.push("Stale baseline entries (" + stale.length + ") — these look fixed.");
    lines.push("Remove them from " + DEFAULT_BASELINE_PATH + " to lock the fix in:");
    for (const entry of stale) lines.push("  " + entry.file + ": " + entry.term);
  }

  return { status: 1, stdout: "", stderr: lines.join("\n") + "\n" };
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
  runCli,
  stripCommentsAndStrings,
  DEFAULT_SCAN_DIRS,
  DEFAULT_ALLOW_PREFIXES,
  DEFAULT_FORBIDDEN_TERMS
};
