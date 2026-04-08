#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
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

// Core files
write(`${instrument}_skill_tree.js`, `window.Spark${name}SkillTree = ${JSON.stringify(template.baseSkills, null, 2)};`);
write(`${instrument}_lessons.js`, `window.Spark${name}Lessons = [${JSON.stringify(template.lesson(instrument), null, 2)}];`);
write(`${instrument}_exercises.js`, `window.Spark${name}Exercises = { ${template.lesson(instrument).skill}: [${JSON.stringify(template.exercise(instrument), null, 2)}] };`);

write(`${instrument}_module.js`, `window.Spark${name}Module = {
  getSkillTree: () => window.Spark${name}SkillTree,
  getLessons: () => window.Spark${name}Lessons,
  getExercises: (s) => window.Spark${name}Exercises[s] || []
};`);

// Auto-registration artifacts
const auto = {
  instrument,
  name,
  template: templateName,
  targetPaths: {
    sparksuite: `js/sparksuite/instruments/${instrument}/`,
    runtime: `js/instruments/${instrument}/`
  },
  instructions: [
    'Move generated files into SparkSuite instruments directory',
    'Create runtime register.js',
    'Hook into launcher and adapter'
  ]
};

write('auto_registration.json', JSON.stringify(auto, null, 2));

if (autoRegister) {
  write('runtime_register.generated.js', `// Register ${name}\nSparkInstruments.register('${instrument}', () => window.Spark${name}Module);`);
}

write('integration_plan.md', `# Integration Plan\n\n1. Move files to js/sparksuite/instruments/${instrument}\n2. Add runtime registration\n3. Validate curriculum\n`);

console.log(`\nGenerated full pipeline for ${instrument} at ${outDir}\n`);
