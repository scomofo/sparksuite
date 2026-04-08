#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const templates = require('./instrument_generator_templates');

const args = process.argv.slice(2);

function arg(flag) {
  const i = args.indexOf(flag);
  return i === -1 ? null : args[i+1];
}

const instrument = arg('--instrument');
const name = arg('--name') || instrument;
const templateName = arg('--template') || 'fretted';
const autoRegister = args.includes('--auto-register');
const apply = args.includes('--apply');

if (!instrument) {
  console.error('Missing --instrument');
  process.exit(1);
}

const template = templates[templateName];
if (!template) {
  console.error('Unknown template:', templateName);
  process.exit(1);
}

const outDir = path.join(process.cwd(), 'generated', 'instruments', instrument);
fs.mkdirSync(outDir, { recursive: true });

function write(file, content) {
  fs.writeFileSync(path.join(outDir, file), content);
}

// Core scaffold
write(`${instrument}_skill_tree.js`, `window.Spark${name}SkillTree = ${JSON.stringify(template.baseSkills, null, 2)};`);
write(`${instrument}_lessons.js`, `window.Spark${name}Lessons = [${JSON.stringify(template.lesson(instrument), null, 2)}];`);
write(`${instrument}_exercises.js`, `window.Spark${name}Exercises = { ${template.lesson(instrument).skill}: [${JSON.stringify(template.exercise(instrument), null, 2)}] };`);

write(`${instrument}_module.js`, `window.Spark${name}Module = {
  getSkillTree: () => window.Spark${name}SkillTree,
  getLessons: () => window.Spark${name}Lessons,
  getExercises: (s) => window.Spark${name}Exercises[s] || []
};`);

write('index.js', `// Entry for ${name}\n`);

// Optional auto-register stub
if (autoRegister) {
  write('runtime_register.generated.js', `SparkInstruments.register('${instrument}', () => window.Spark${name}Module);`);
}

console.log(`\nGenerated scaffold for ${instrument}`);

// Validation step
try {
  execSync('node scripts/validate_curriculum.js', { stdio: 'inherit' });
} catch (e) {
  console.error('Validation failed. Fix issues before applying.');
  process.exit(1);
}

// Apply step
if (apply) {
  console.log('\nApplying instrument...');
  try {
    execSync(`node scripts/apply_generated_instrument_final.js --instrument ${instrument}`, { stdio: 'inherit' });
  } catch (e) {
    console.error('Apply failed');
    process.exit(1);
  }

  console.log('\n✅ Instrument fully generated, validated, and applied');
} else {
  console.log('\nℹ️ Run with --apply to auto-integrate and enable discovery');
}
