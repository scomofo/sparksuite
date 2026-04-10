/**
 * auto_fix_handlers.js
 *
 * Automatically patches silent failure patterns in SparkSuite JS files.
 * Adds console.warn before bare "return null;" in Request/Handler functions.
 *
 * Usage: node tools/auto_fix_handlers.js
 */

var fs = require("fs");
var path = require("path");

var ROOT = path.resolve(__dirname, "..", "js");
var IGNORE = ["node_modules", ".git", "dist", "build", "tools"];
var modified = 0;
var fixes = 0;

function walk(dir) {
  var results = [];
  var entries;
  try {
    entries = fs.readdirSync(dir);
  } catch (e) {
    return results;
  }
  for (var i = 0; i < entries.length; i++) {
    if (IGNORE.indexOf(entries[i]) >= 0) continue;
    var full = path.join(dir, entries[i]);
    var stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (entries[i].endsWith(".js")) {
      results.push(full);
    }
  }
  return results;
}

function findEnclosingFunction(lines, lineIndex) {
  // Walk backwards from lineIndex to find the nearest function declaration
  for (var i = lineIndex - 1; i >= 0; i--) {
    var line = lines[i];
    // Match: function someName(  or  async function someName(
    var match = line.match(/function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/);
    if (match) {
      return match[1];
    }
    // Match: someName = function(  or  someName: function(
    var assignMatch = line.match(/([A-Za-z_$][A-Za-z0-9_$]*)\s*[:=]\s*(?:async\s+)?function\s*\(/);
    if (assignMatch) {
      return assignMatch[1];
    }
    // Match: var/let/const someName = (  arrow functions
    var arrowMatch = line.match(/(?:var|let|const)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s+)?\(/);
    if (arrowMatch && line.indexOf("=>") >= 0) {
      return arrowMatch[1];
    }
    // Match: someName(args) {  method syntax
    var methodMatch = line.match(/([A-Za-z_$][A-Za-z0-9_$]*)\s*\([^)]*\)\s*\{/);
    if (methodMatch && line.indexOf("function") < 0 && line.indexOf("if") < 0 && line.indexOf("while") < 0 && line.indexOf("for") < 0 && line.indexOf("switch") < 0) {
      return methodMatch[1];
    }
  }
  return null;
}

function processFile(filePath) {
  var content = fs.readFileSync(filePath, "utf8");
  var lines = content.split("\n");
  var newLines = [];
  var fileFixed = 0;
  var relPath = path.relative(path.resolve(__dirname, ".."), filePath).split(path.sep).join("/");

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var trimmed = line.trim();

    // Check if this line is a bare "return null;"
    if (trimmed === "return null;") {
      var funcName = findEnclosingFunction(lines, i);

      // Only fix if the function has "Request" or "Handler" in the name
      if (funcName && (funcName.indexOf("Request") >= 0 || funcName.indexOf("Handler") >= 0)) {
        // Check if previous line (in newLines) already has console.warn or console.error
        var prevLine = newLines.length > 0 ? newLines[newLines.length - 1].trim() : "";
        var alreadyWarned = prevLine.indexOf("console.warn") >= 0 || prevLine.indexOf("console.error") >= 0;

        if (!alreadyWarned) {
          // Preserve indentation from the return null line
          var indent = line.match(/^(\s*)/)[1];
          var warnLine = indent + "console.warn(\"[No Handler] " + funcName + "\");";
          newLines.push(warnLine);
          fileFixed++;
          fixes++;
          // Line number is 1-based
          console.log("  FIXED: " + relPath + ":" + (i + 1) + " - " + funcName);
        }
      }
    }

    newLines.push(line);
  }

  if (fileFixed > 0) {
    fs.writeFileSync(filePath, newLines.join("\n"), "utf8");
    modified++;
  }
}

// Main
console.log("Auto-fixing silent handlers...");

if (!fs.existsSync(ROOT)) {
  console.log("No js/ directory found at " + ROOT);
  console.log("Done: 0 fixes in 0 files");
  process.exit(0);
}

var files = walk(ROOT);

for (var i = 0; i < files.length; i++) {
  processFile(files[i]);
}

console.log("Done: " + fixes + " fixes in " + modified + " files");
process.exit(0);
