#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

const args = process.argv.slice(2);

function arg(flag) {
  const i = args.indexOf(flag);
  return i === -1 ? null : args[i + 1];
}

const instrument = arg('--instrument');

if (!instrument) {
  console.error('Missing --instrument');
  process.exit(1);
}

// Step 1: full pipeline (generate + validate + apply)
try {
  execSync(`node scripts/generate_instrument_pipeline_final.js ${args.join(' ')} --apply`, { stdio: 'inherit' });
} catch (e) {
  console.error('Pipeline failed');
  process.exit(1);
}

// Step 2: open preview with auto-selected instrument
console.log('\n🚀 Launching preview with auto-selected instrument...\n');

const previewPath = path.resolve(process.cwd(), `preview_instrument.html?instrument=${instrument}`);

try {
  const platform = os.platform();

  if (platform === 'win32') {
    execSync(`start "" "${previewPath}"`);
  } else if (platform === 'darwin') {
    execSync(`open "${previewPath}"`);
  } else {
    execSync(`xdg-open "${previewPath}"`);
  }

  console.log(`\n✅ Preview opened for instrument: ${instrument}`);
} catch (e) {
  console.log('Could not auto-open browser. Open manually:');
  console.log(previewPath);
}
