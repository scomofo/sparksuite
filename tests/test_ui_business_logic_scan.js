var assert = require("assert");
var fs = require("fs");
var os = require("os");
var path = require("path");

var repoRoot = path.resolve(__dirname, "..");
var scanner = require("../scripts/check_ui_business_logic.js");

function tempDirWith(files) {
  var root = fs.mkdtempSync(path.join(os.tmpdir(), "sparksuite-ui-scan-"));
  var dir = path.join(root, "pages");
  fs.mkdirSync(dir, { recursive: true });
  Object.keys(files).forEach(function (name) {
    fs.writeFileSync(path.join(dir, name), files[name], "utf8");
  });
  return dir;
}

function scanTemp(dir, extraEnv) {
  return scanner.runScan({
    repoRoot: repoRoot,
    fs: fs,
    env: Object.assign({}, process.env, { UI_LOGIC_DIRS: dir }, extraEnv || {})
  });
}

// --- The repository itself stays at or below its recorded baseline ---------

var repoRun = scanner.runScan({ repoRoot: repoRoot, fs: fs });
assert.strictEqual(repoRun.status, 0, repoRun.stderr);
assert.ok(repoRun.stdout.indexOf("OK no") >= 0, repoRun.stdout);

// --- Forbidden terms are caught as definitions and as bare global calls ----

var badCall = tempDirWith({ "bad.js": "function render(){ return adjustDifficulty(); }\n" });
var badCallRun = scanTemp(badCall);
assert.notStrictEqual(badCallRun.status, 0);
assert.ok(badCallRun.stderr.indexOf("adjustDifficulty") >= 0);

var badDecl = tempDirWith({ "bad.js": "function addXP(n){ S.xp += n; }\n" });
var badDeclRun = scanTemp(badDecl);
assert.notStrictEqual(badDeclRun.status, 0, "a bare function declaration is a violation");
assert.ok(badDeclRun.stderr.indexOf("addXP") >= 0);

var badProp = tempDirWith({ "bad.js": "var api = { updateMastery: function(a,b){ return a; } };\n" });
var badPropRun = scanTemp(badProp);
assert.notStrictEqual(badPropRun.status, 0, "a property definition is a violation");
assert.ok(badPropRun.stderr.indexOf("updateMastery") >= 0);

// --- Delegating to an engine through a member call is NOT a violation -----

var goodMember = tempDirWith({
  "good.js": "function page(){ return sparkCore.getNextLesson() + SparkProgress.addXP(5); }\n"
});
assert.strictEqual(
  scanTemp(goodMember).status,
  0,
  "member calls are the sanctioned way for UI to reach an engine"
);

// --- Comments and strings never trip the scan -----------------------------

var goodProse = tempDirWith({
  "good.js": [
    "// getNextLesson() used to live here; it moved to CurriculumEngine.",
    "/* unlockSkill() and addXP() are engine-owned. */",
    'var label = "adjustDifficulty";',
    "var tpl = `calls updateMastery() in docs only`;",
    "function page(){ return label; }"
  ].join("\n") + "\n"
});
assert.strictEqual(
  scanTemp(goodProse).status,
  0,
  "comments and string literals must not be matched"
);

assert.strictEqual(
  scanner.stripCommentsAndStrings("a // addXP(\nb").indexOf("addXP"),
  -1,
  "line comments are stripped"
);
assert.strictEqual(
  scanner.stripCommentsAndStrings("x = 'addXP('; y").indexOf("addXP"),
  -1,
  "string literals are stripped"
);

// --- The scan reaches the trees the old three-directory scope missed ------

["js/actions", "js/utils", "js/instruments", "js/meta", "js/progression"].forEach(function (tree) {
  assert.ok(
    scanner.DEFAULT_SCAN_DIRS.some(function (dir) {
      return tree.indexOf(dir + "/") === 0 || tree === dir;
    }),
    tree + " must be inside the scanned scope"
  );
});
assert.ok(
  scanner.DEFAULT_ALLOW_PREFIXES.indexOf("js/sparksuite") >= 0,
  "the engine tree is allowlisted — that is where this logic belongs"
);

// --- The baseline is a ratchet: it may shrink, never silently grow --------

var baseline = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "scripts/ui_business_logic_baseline.json"), "utf8")
);
assert.ok(Array.isArray(baseline.knownViolations), "baseline lists knownViolations");
baseline.knownViolations.forEach(function (entry) {
  assert.ok(entry.file && entry.term, "each baseline entry names a file and a term");
  assert.ok(entry.note, "each baseline entry explains what should own the logic instead");
});

var raw = scanner.collectViolations({
  repoRoot: repoRoot,
  fs: fs,
  env: Object.assign({}, process.env, { UI_LOGIC_NO_BASELINE: "1" })
});
assert.strictEqual(
  raw.violations.length,
  baseline.knownViolations.length,
  "every raw violation is accounted for in the baseline, and vice versa"
);

console.log(
  "PASS: UI business logic scan covers all of js/, matches identifiers not substrings, and ratchets its baseline"
);
