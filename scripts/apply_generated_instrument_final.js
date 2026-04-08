#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

function arg(flag) {
  const i = args.indexOf(flag);
  return i === -1 ? null : args[i + 1];
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
const manifestPath = path.join(root, 'js', 'instruments', 'instrument_manifest.generated.js');

fs.mkdirSync(targetSparkSuite, { recursive: true });
fs.mkdirSync(targetRuntime, { recursive: true });

const report = {
  instrument,
  copied: [],
  skipped: [],
  created: [],
  manifestUpdated: false,
  manifestEntry: null
};

function safeCopy(src, dest) {
  if (fs.existsSync(dest) && !overwrite) {
    report.skipped.push(dest);
    return false;
  }
  fs.copyFileSync(src, dest);
  report.copied.push(dest);
  return true;
}

function collectJsFiles(dir, prefix) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(name => name.endsWith('.js'))
    .sort()
    .map(name => prefix + '/' + name);
}

function readManifestEntries() {
  if (!fs.existsSync(manifestPath)) return [];
  const raw = fs.readFileSync(manifestPath, 'utf8');
  const prefix = 'window.SparkInstrumentDiscoveryManifest = ';
  if (!raw.startsWith(prefix)) return [];
  const jsonText = raw.slice(prefix.length).trim().replace(/;$/, '');
  try {
    const parsed = JSON.parse(jsonText);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Could not parse manifest:', err.message);
    process.exit(1);
  }
}

const generatedFiles = fs.readdirSync(srcDir).filter(name => name.endsWith('.js'));
for (const file of generatedFiles) {
  if (file === 'runtime_register.generated.js') continue;
  const src = path.join(srcDir, file);
  const dest = path.join(targetSparkSuite, file);
  safeCopy(src, dest);
}

const registerPath = path.join(targetRuntime, 'register.js');
if (!fs.existsSync(registerPath) || overwrite) {
  const content = [
    '(function(){',
    '  SparkInstruments.register({',
    `    id: ${JSON.stringify(instrument)},`,
    `    name: ${JSON.stringify(instrument)},`,
    '    init: function(){}',
    '  });',
    '})();',
    ''
  ].join('\n');
  fs.writeFileSync(registerPath, content);
  report.created.push(registerPath);
}

const runtimeIndexPath = path.join(targetRuntime, 'index.js');
if (!fs.existsSync(runtimeIndexPath) || overwrite) {
  fs.writeFileSync(runtimeIndexPath, `// ${instrument} runtime entry\n`);
  report.created.push(runtimeIndexPath);
}

const entry = {
  id: instrument,
  enabled: true,
  sparkSuiteFiles: collectJsFiles(targetSparkSuite, `js/sparksuite/instruments/${instrument}`),
  runtimeFiles: collectJsFiles(targetRuntime, `js/instruments/${instrument}`)
};

const manifestEntries = readManifestEntries();
const existingIndex = manifestEntries.findIndex(item => item && item.id === instrument);
if (existingIndex >= 0) manifestEntries[existingIndex] = entry;
else manifestEntries.push(entry);

const manifestContent = 'window.SparkInstrumentDiscoveryManifest = ' + JSON.stringify(manifestEntries, null, 2) + ';\n';
fs.writeFileSync(manifestPath, manifestContent);
report.manifestUpdated = true;
report.manifestEntry = entry;

const reportJsonPath = path.join(srcDir, 'apply_report.json');
fs.writeFileSync(reportJsonPath, JSON.stringify(report, null, 2));

const reportMdPath = path.join(srcDir, 'apply_report.md');
const mdLines = [
  '# Auto Integration Report',
  '',
  `Instrument: ${instrument}`,
  '',
  '## Manifest',
  '',
  report.manifestUpdated ? '- Updated discovery manifest' : '- Manifest not updated',
  '',
  '## Copied',
  '',
  ...(report.copied.length ? report.copied.map(v => `- ${v}`) : ['- none']),
  '',
  '## Created',
  '',
  ...(report.created.length ? report.created.map(v => `- ${v}`) : ['- none']),
  '',
  '## Skipped',
  '',
  ...(report.skipped.length ? report.skipped.map(v => `- ${v}`) : ['- none'])
];
fs.writeFileSync(reportMdPath, mdLines.join('\n'));

console.log('\n=== Auto Integration Report ===\n');
console.log(JSON.stringify(report, null, 2));
