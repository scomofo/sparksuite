#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

function arg(flag) {
  const i = args.indexOf(flag);
  return i === -1 ? null : args[i+1];
}

const instrument = arg('--instrument');
const overwrite = args.includes('--overwrite');

if (!instrument) {
  console.error('Missing --instrument');
  process.exit(1);
}

const root = process.cwd();
const srcDir = path.join(root, 'generated', 'instruments', instrument);

if (!fs.existsSync(srcDir)) {
  console.error('Generated instrument not found:', srcDir);
  process.exit(1);
}

const targetSparkSuite = path.join(root, 'js', 'sparksuite', 'instruments', instrument);
const targetRuntime = path.join(root, 'js', 'instruments', instrument);

fs.mkdirSync(targetSparkSuite, { recursive: true });
fs.mkdirSync(targetRuntime, { recursive: true });

const report = {
  instrument,
  copied: [],
  skipped: [],
  created: []
};

function safeCopy(src, dest) {
  if (fs.existsSync(dest) && !overwrite) {
    report.skipped.push(dest);
    return;
  }
  fs.copyFileSync(src, dest);
  report.copied.push(dest);
}

// Copy SparkSuite files
fs.readdirSync(srcDir).forEach(file => {
  if (file.endsWith('.js') && !file.includes('runtime_register')) {
    const src = path.join(srcDir, file);
    const dest = path.join(targetSparkSuite, file);
    safeCopy(src, dest);
  }
});

// Create runtime register.js
const registerPath = path.join(targetRuntime, 'register.js');
if (!fs.existsSync(registerPath) || overwrite) {
  const content = `(function(){\n  SparkInstruments.register({ id: '${instrument}', name: '${instrument}', init: function(){} });\n})();`;
  fs.writeFileSync(registerPath, content);
  report.created.push(registerPath);
}

// Create runtime index.js
const indexPath = path.join(targetRuntime, 'index.js');
if (!fs.existsSync(indexPath) || overwrite) {
  fs.writeFileSync(indexPath, `// ${instrument} runtime entry\n`);
  report.created.push(indexPath);
}

// Write report
const reportPath = path.join(srcDir, 'apply_report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log('\n=== Auto Integration Report ===\n');
console.log(JSON.stringify(report, null, 2));
