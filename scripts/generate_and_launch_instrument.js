#!/usr/bin/env node

const { execSync, spawn } = require('child_process');

const args = process.argv.slice(2).join(' ');

// Step 1: Generate + apply
try {
  execSync(`node scripts/generate_instrument_pipeline_final.js ${args} --apply`, { stdio: 'inherit' });
} catch (e) {
  console.error('Generation failed');
  process.exit(1);
}

// Step 2: Launch app
console.log('\n🚀 Launching app for live preview...\n');

try {
  // Try common dev commands
  spawn('npm', ['start'], { stdio: 'inherit', shell: true });
} catch (e) {
  console.log('Fallback: open index.html manually');
}

console.log('\n💡 Tip: Navigate to your new instrument in UI once app loads');
