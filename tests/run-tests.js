#!/usr/bin/env node
/*
 * SparkSuite test runner.
 *
 * Replaces the brittle `node a.js && node b.js && ...` chain in package.json,
 * where a single failure halted every downstream test. This runner:
 *   - auto-discovers every tests/test_*.js (no manual list to keep in sync)
 *   - runs each file in its own process and CONTINUES on failure
 *   - prints a per-file result and an aggregate summary
 *   - exits non-zero if any file failed (so CI still goes red)
 *
 * Usage:
 *   node tests/run-tests.js                 # run everything
 *   node tests/run-tests.js timing transport # run only files matching a substring
 *   node tests/run-tests.js --quiet          # summary only, suppress child output
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const TESTS_DIR = __dirname;
const args = process.argv.slice(2);
const quiet = args.includes('--quiet');
const filters = args.filter((a) => !a.startsWith('--'));

const allFiles = fs
  .readdirSync(TESTS_DIR)
  .filter((f) => /^test_.*\.js$/.test(f))
  .sort();

const files = filters.length
  ? allFiles.filter((f) => filters.some((needle) => f.includes(needle)))
  : allFiles;

if (!files.length) {
  console.error('No matching test files found.');
  process.exit(1);
}

const results = [];
const startedAt = Date.now();

for (const file of files) {
  const full = path.join(TESTS_DIR, file);
  const run = spawnSync(process.execPath, [full], {
    encoding: 'utf8',
    stdio: quiet ? 'pipe' : 'inherit',
  });
  const ok = run.status === 0;
  const exitInfo = run.status !== null ? `exit ${run.status}` : run.signal ? `signal ${run.signal}` : 'spawn failed';
  results.push({ file, ok, exitInfo });
  if (!quiet) {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${file}${ok ? '' : `  (${exitInfo})`}`);
  } else if (!ok) {
    // In quiet mode, surface failing output so the failure is debuggable.
    console.log(`\nFAIL  ${file}  (${exitInfo})`);
    if (run.stdout) process.stdout.write(run.stdout.split('\n').slice(-15).join('\n') + '\n');
    if (run.stderr) process.stderr.write(run.stderr);
  }
}

const passed = results.filter((r) => r.ok);
const failed = results.filter((r) => !r.ok);
const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);

console.log('\n' + '='.repeat(48));
console.log(`Test files: ${results.length} | passed: ${passed.length} | failed: ${failed.length} | ${seconds}s`);
if (failed.length) {
  console.log('\nFailing files:');
  for (const r of failed) console.log(`  - ${r.file} (${r.exitInfo})`);
}
console.log('='.repeat(48));

process.exit(failed.length ? 1 : 0);
