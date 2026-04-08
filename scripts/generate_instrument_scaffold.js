#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

function getArg(flag) {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  return args[index + 1];
}

const instrumentId = getArg('--instrument');
const name = getArg('--name') || instrumentId;

if (!instrumentId) {
  console.error('Missing --instrument argument');
  process.exit(1);
}

const baseDir = path.join(process.cwd(), 'generated', 'instruments', instrumentId);

fs.mkdirSync(baseDir, { recursive: true });

function write(file, content) {
  fs.writeFileSync(path.join(baseDir, file), content);
}

write('manifest.json', JSON.stringify({ instrumentId, name }, null, 2));

write(`${instrumentId}_skill_tree.js`, `window.Spark${name}SkillTree = [\n  { id: "basic", category: "fundamentals", label: "Basic" }\n];\n`);

write(`${instrumentId}_lessons.js`, `window.Spark${name}Lessons = [\n  { id: "${instrumentId}_01", skill: "basic", prerequisites: [] }\n];\n`);

write(`${instrumentId}_exercises.js`, `window.Spark${name}Exercises = {\n  basic: [\n    { id: "${instrumentId}_basic_01", type: "exercise", durationSec: 60 }\n  ]\n};\n`);

write(`${instrumentId}_module.js`, `window.Spark${name}Module = {\n  getSkillTree: () => window.Spark${name}SkillTree,\n  getLessons: () => window.Spark${name}Lessons,\n  getExercises: (skill) => window.Spark${name}Exercises[skill] || []\n};\n`);

write('index.js', `// Entry for ${name}\n`);

console.log(`\nGenerated scaffold at: ${baseDir}\n`);
