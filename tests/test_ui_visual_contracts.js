const assert = require("assert");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");

function read(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), "utf8");
}

function walk(dir, files) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (/\.js$/.test(entry)) files.push(full);
  }
  return files;
}

const css = read("styles.css");
[
  ".card-section-heading",
  ".card-micro-heading",
  ".metric-label",
  ".metric-value",
  ".split-row",
  ".action-row",
  ".practice-card-heading",
  ".guided-card-heading",
  ".result-actions"
].forEach((className) => {
  assert.ok(css.includes(className), "missing shared visual class " + className);
});

const scanRoots = [
  "js/pages",
  "js/instruments/piano/pages",
  "js/analytics",
  "js/home",
  "js/insights",
  "js/settings",
  "js/curriculum",
  "js/import",
  "js/progression",
  "js/sparksuite/ui"
];

const files = scanRoots.flatMap((rel) => walk(path.join(repoRoot, rel), []));
const patterns = [
  {
    name: "small heavy inline label",
    regex: /font-size:1[3456]px;font-weight:(?:800|900)/g
  },
  {
    name: "heavy inline card heading",
    regex: /font-size:2[0246]px;font-weight:900/g
  },
  {
    name: "raw bold label",
    regex: /<b>[^<]+<\/b>/g
  },
  {
    name: "adjacent buttons without action row",
    regex: /<\/button>\s+<button/g
  },
  {
    name: "split row without gap",
    regex: /display:flex;justify-content:space-between;align-items:center(?![^"]*gap)/g
  }
];

const allowed = [
  /js[\\/]pages[\\/]games\.js\|.*font-size:2[0246]px;font-weight:900/,
  /js[\\/]pages[\\/]games\.js\|.*score|combo|BPM|Tap on the beat|High Score|STRUM|TAP|New High Score|targetShort/i,
  /js[\\/]pages[\\/]practice\.js\|.*<button/,
  /js[\\/]pages[\\/]practice\.js\|.*font-size:22px;font-weight:900/,
  /js[\\/]pages[\\/]guided\.js\|.*font-size:2[0246]px;font-weight:900/,
  /js[\\/]pages[\\/]guided\.js\|.*font-size:28px;font-weight:900/,
  /js[\\/]pages[\\/]guided\.js\|.*font-size:16px;font-weight:900/,
  /js[\\/]pages[\\/]guided\.js\|.*<button/,
  /js[\\/]pages[\\/]session\.js\|.*font-size:2[02468]px;font-weight:900/,
  /js[\\/]pages[\\/]session\.js\|.*font-size:3[26]px;font-weight:900/,
  /js[\\/]pages[\\/]session\.js\|.*font-size:18px;font-weight:900/,
  /js[\\/]pages[\\/]session\.js\|.*font-size:16px;font-weight:800/,
  /js[\\/]pages[\\/]tools\.js\|.*font-size:72px;font-weight:900/,
  /js[\\/]pages[\\/]tools\.js\|.*font-size:28px;font-weight:900/,
  /js[\\/]pages[\\/]tools\.js\|.*font-size:2[02]px;font-weight:900/,
  /js[\\/]pages[\\/]tools\.js\|.*font-size:16px;font-weight:800/,
  /js[\\/]pages[\\/]perform\.js\|.*font-size:28px;font-weight:900/,
  /js[\\/]pages[\\/]perform\.js\|.*font-size:26px;font-weight:900/,
  /js[\\/]pages[\\/]perform_song\.js\|.*font-size:20px;font-weight:900/,
  /js[\\/]pages[\\/]performance_stats\.js\|.*font-size:22px;font-weight:900/,
  /js[\\/]pages[\\/]rhythm_highway\.js\|.*font-size:2[246]px;font-weight:900/,
  /js[\\/]pages[\\/]shared\.js\|.*font-size:16px;font-weight:900/,
  /js[\\/]pages[\\/]shared\.js\|.*font-size:20px;font-weight:900/,
  /js[\\/]pages[\\/]shared\.js\|.*font-size:13px;font-weight:800/,
  /js[\\/]pages[\\/]skill_dashboard\.js\|.*font-size:22px;font-weight:900/,
  /js[\\/]pages[\\/]songs\.js\|.*font-size:22px;font-weight:900/,
  /js[\\/]pages[\\/]songs\.js\|.*<button/,
  /js[\\/]instruments[\\/]piano[\\/]pages[\\/]games\.js\|.*font-size:2[0246]px;font-weight:900/
];

const violations = [];

for (const file of files) {
  const rel = path.relative(repoRoot, file).replace(/\\/g, "/");
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      pattern.regex.lastIndex = 0;
      if (!pattern.regex.test(line)) continue;
      const key = rel + "|" + line.trim();
      if (allowed.some((allow) => allow.test(key))) continue;
      violations.push(rel + ":" + (index + 1) + " " + pattern.name + ": " + line.trim());
    }
  });
}

assert.deepStrictEqual(violations, []);

console.log("PASS: UI visual contracts keep card labels, action rows, and split rows polished");
