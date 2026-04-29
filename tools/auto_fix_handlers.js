// SparkSuite Auto-Fix Pass
// Run: node tools/auto_fix_handlers.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IGNORE = ['node_modules', '.git', 'dist', 'build'];

function walk(dir, files = []) {
  for (const file of fs.readdirSync(dir)) {
    if (IGNORE.includes(file)) continue;
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      walk(full, files);
    } else if (file.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

function fixContent(content) {
  let modified = content;

  // Fix 1: Replace silent null returns after sparkCore checks
  modified = modified.replace(
    /if \(([^)]*sparkCore[^)]*)\) \{([^}]*)\}\s*return null;/g,
    (match, condition, body) => {
      return `if (${condition}) {${body}} else {\n  console.warn('[Missing Handler] sparkCore path failed');\n}`;
    }
  );

  // Fix 2: Replace direct optional chaining calls with guarded calls
  modified = modified.replace(
    /window\.sparkCore\?\.([a-zA-Z0-9_]+)\(([^)]*)\)/g,
    (match, fn, args) => {
      return `(function(){\n  if (!window.sparkCore || typeof window.sparkCore.${fn} !== 'function') {\n    console.warn('[Missing Handler] ${fn}');\n    return;\n  }\n  return window.sparkCore.${fn}(${args});\n})()`;
    }
  );

  return modified;
}

function run() {
  const files = walk(ROOT);
  let changedFiles = 0;

  files.forEach(file => {
    const original = fs.readFileSync(file, 'utf8');
    const updated = fixContent(original);

    if (original !== updated) {
      fs.writeFileSync(file, updated, 'utf8');
      console.log(`✔ Fixed: ${file}`);
      changedFiles++;
    }
  });

  console.log(`\nAuto-fix complete. Files modified: ${changedFiles}`);
}

run();
