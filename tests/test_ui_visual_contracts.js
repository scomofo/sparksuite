const assert = require("assert");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");

function read(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), "utf8");
}

function walk(dir, files, visited = new Set()) {
  if (!fs.existsSync(dir)) return files;
  const stat = fs.lstatSync(dir);
  if (stat.isSymbolicLink()) return files;
  const realDir = fs.realpathSync(dir);
  if (visited.has(realDir)) return files;
  visited.add(realDir);
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const entryStat = fs.lstatSync(full);
    if (entryStat.isSymbolicLink()) continue;
    if (entryStat.isDirectory()) walk(full, files, visited);
    else if (/\.js$/.test(entry)) files.push(full);
  }
  return files;
}

function loadVisualContractsAllowlist(roots) {
  const entries = [];
  for (const relRoot of roots) {
    const configPath = path.join(repoRoot, relRoot, ".visual-contracts.json");
    if (!fs.existsSync(configPath)) continue;
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    for (const pattern of config.allowed || []) entries.push(new RegExp(pattern));
  }
  return entries;
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

const allowed = loadVisualContractsAllowlist(scanRoots);

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
