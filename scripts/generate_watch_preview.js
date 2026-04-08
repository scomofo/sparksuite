#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

const args = process.argv.slice(2);

function run() {
  try {
    execSync(`node scripts/generate_and_launch_instrument_preview.js ${args.join(' ')}`, { stdio: 'inherit' });

    // trigger reload signal
    fs.writeFileSync('.preview_reload', Date.now().toString());
  } catch (e) {
    console.log('Generation failed — not reloading');
  }
}

run();

fs.watch('.', { recursive: true }, (eventType, filename) => {
  if (!filename) return;

  if (
    filename.includes('generated') ||
    filename.includes('instrument') ||
    filename.includes('curriculum')
  ) {
    console.log('\n🔁 Change detected:', filename);
    run();
  }
});
