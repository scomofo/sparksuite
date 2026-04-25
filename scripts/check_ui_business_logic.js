const fs = require("fs");
const path = require("path");

const repoRoot = process.cwd();
const uiDirs = (process.env.UI_LOGIC_DIRS
  ? process.env.UI_LOGIC_DIRS.split(path.delimiter)
  : ["js/ui", "js/pages", "components"])
  .map((entry) => path.resolve(repoRoot, entry));

const forbidden = process.env.UI_LOGIC_FORBIDDEN
  ? process.env.UI_LOGIC_FORBIDDEN.split(",").map((term) => term.trim()).filter(Boolean)
  : [
      "adjustDifficulty",
      "updateMastery",
      "unlockSkill",
      "addXP",
      "getNextLesson",
      "masteryDelta",
      "rewardPlan"
    ];

const violations = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (/\.(js|ts|jsx|tsx)$/.test(full)) scanFile(full);
  }
}

function scanFile(file) {
  const text = fs.readFileSync(file, "utf8");
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

if (violations.length) {
  console.error("UI business logic violations:");
  for (const violation of violations) {
    console.error(`- ${violation.file}: ${violation.term}`);
  }
  process.exit(1);
}

console.log("OK no UI business logic violations found");
