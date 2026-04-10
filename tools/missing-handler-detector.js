#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");

// --- Config ---------------------------------------------------------------

var JS_DIR = path.resolve(__dirname, "..", "js");
var HTML_DIR = path.resolve(__dirname, "..");

var SPARK_CORE_FILES = [
  path.join(JS_DIR, "sparksuite", "core", "spark_core.js"),
  path.join(JS_DIR, "sparksuite", "core", "spotify_integration.js"),
  path.join(JS_DIR, "sparksuite", "core", "system_wiring.js"),
];

var BUILTIN_GLOBALS = new Set([
  "fetch", "setTimeout", "setInterval", "clearTimeout", "clearInterval",
  "parseInt", "parseFloat", "isNaN", "isFinite", "encodeURIComponent",
  "decodeURIComponent", "encodeURI", "decodeURI", "btoa", "atob",
  "requestAnimationFrame", "cancelAnimationFrame", "alert", "confirm",
  "prompt", "console", "document", "window", "navigator", "location",
  "history", "localStorage", "sessionStorage", "performance",
  "getComputedStyle", "matchMedia", "open", "close", "focus", "blur",
  "scroll", "scrollTo", "scrollBy", "print", "postMessage",
  "addEventListener", "removeEventListener", "dispatchEvent",
  "createElement", "getElementById", "querySelector", "querySelectorAll",
  "requestIdleCallback", "cancelIdleCallback", "queueMicrotask",
  "structuredClone", "reportError",
  "require", "module", "exports", "process", "global", "Buffer",
  "__dirname", "__filename",
  "JSON", "Math", "Date", "Array", "Object", "String", "Number",
  "Boolean", "RegExp", "Error", "TypeError", "RangeError", "Map",
  "Set", "WeakMap", "WeakSet", "Promise", "Symbol", "Proxy", "Reflect",
  "Uint8Array", "Float32Array", "Int16Array", "ArrayBuffer", "DataView",
  "Intl", "URL", "URLSearchParams", "FormData", "Headers", "Request",
  "Response", "Blob", "File", "FileReader", "Image", "Audio",
  "AudioContext", "WebSocket", "Worker", "SharedWorker",
  "IntersectionObserver", "MutationObserver", "ResizeObserver",
  "XMLHttpRequest", "AbortController", "TextEncoder", "TextDecoder",
  "crypto", "caches", "indexedDB",
  "S", "T", "SCR", "TAB", "render", "act", "escHTML", "saveState",
  "event", "e", "el", "ev",
  "cb", "fn", "err", "res", "req", "val", "key", "idx", "obj", "arr",
  "str", "num", "msg", "opt", "cfg", "ctx", "ref", "src", "dst",
]);

// --- Helpers ---------------------------------------------------------------

function collectFiles(dir, ext, results) {
  results = results || [];
  if (!fs.existsSync(dir)) return results;
  var entries = fs.readdirSync(dir, { withFileTypes: true });
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      collectFiles(full, ext, results);
    } else if (entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

function readFileLines(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8").split("\n");
  } catch (_) {
    return [];
  }
}

function relPath(filePath) {
  return path.relative(path.resolve(__dirname, ".."), filePath).replace(/\\/g, "/");
}

// --- 1. SparkCore Method Gap Detector --------------------------------------

function detectSparkCoreGaps(jsFiles) {
  var findings = [];
  var referenced = new Map();
  var refPattern = /(?:window\.)?sparkCore\.(\w+)/g;

  for (var fi = 0; fi < jsFiles.length; fi++) {
    var file = jsFiles[fi];
    var lines = readFileLines(file);
    for (var i = 0; i < lines.length; i++) {
      var match;
      refPattern.lastIndex = 0;
      while ((match = refPattern.exec(lines[i])) !== null) {
        var method = match[1];
        if (!referenced.has(method)) referenced.set(method, []);
        referenced.get(method).push({ file: relPath(file), line: i + 1 });
      }
    }
  }

  var defined = new Set();
  var protoPattern = /SparkCore\.prototype\.(\w+)/g;
  var thisPattern = /this\.(\w+)\s*=/g;

  for (var ci = 0; ci < SPARK_CORE_FILES.length; ci++) {
    var coreLines = readFileLines(SPARK_CORE_FILES[ci]);
    for (var li = 0; li < coreLines.length; li++) {
      var m;
      protoPattern.lastIndex = 0;
      while ((m = protoPattern.exec(coreLines[li])) !== null) defined.add(m[1]);
      thisPattern.lastIndex = 0;
      while ((m = thisPattern.exec(coreLines[li])) !== null) defined.add(m[1]);
    }
  }

  for (var fi2 = 0; fi2 < jsFiles.length; fi2++) {
    var allLines = readFileLines(jsFiles[fi2]);
    for (var li2 = 0; li2 < allLines.length; li2++) {
      var m2;
      protoPattern.lastIndex = 0;
      while ((m2 = protoPattern.exec(allLines[li2])) !== null) defined.add(m2[1]);
    }
  }

  referenced.forEach(function (refs, method) {
    if (!defined.has(method)) {
      for (var ri = 0; ri < refs.length; ri++) {
        findings.push({
          severity: "CRITICAL",
          category: "sparkCore gap",
          message: "window.sparkCore." + method + " called in " + refs[ri].file + ":" + refs[ri].line + " but not defined",
        });
      }
    }
  });

  return findings;
}

// --- 2. act() Action Gap Detector ------------------------------------------

function detectActGaps(jsFiles, htmlFiles) {
  var findings = [];
  var dispatched = new Map();
  var actPatterns = [
    /act\(\s*["']([^"']+)["']/g,
    /act\(\s*`([^`]+)`/g,
  ];

  var allFiles = jsFiles.concat(htmlFiles);
  for (var fi = 0; fi < allFiles.length; fi++) {
    var file = allFiles[fi];
    var lines = readFileLines(file);
    for (var i = 0; i < lines.length; i++) {
      for (var pi = 0; pi < actPatterns.length; pi++) {
        var match;
        actPatterns[pi].lastIndex = 0;
        while ((match = actPatterns[pi].exec(lines[i])) !== null) {
          var action = match[1];
          if (!dispatched.has(action)) dispatched.set(action, []);
          dispatched.get(action).push({ file: relPath(file), line: i + 1 });
        }
      }
    }
  }

  var handled = new Set();
  var handlerPatterns = [
    /case\s+["']([^"']+)["']/g,
    /[a-zA-Z_$]\s*===?\s*["']([^"']+)["']/g,
    /["']([^"']+)["']\s*===?\s*[a-zA-Z_$]/g,
  ];

  for (var fi2 = 0; fi2 < jsFiles.length; fi2++) {
    var hLines = readFileLines(jsFiles[fi2]);
    for (var li = 0; li < hLines.length; li++) {
      for (var pi2 = 0; pi2 < handlerPatterns.length; pi2++) {
        var m;
        handlerPatterns[pi2].lastIndex = 0;
        while ((m = handlerPatterns[pi2].exec(hLines[li])) !== null) {
          handled.add(m[1]);
        }
      }
    }
  }

  dispatched.forEach(function (refs, action) {
    if (!handled.has(action)) {
      for (var ri = 0; ri < refs.length; ri++) {
        findings.push({
          severity: "HIGH",
          category: "unhandled action",
          message: "act(\"" + action + "\") in " + refs[ri].file + ":" + refs[ri].line + " has no handler",
        });
      }
    }
  });

  return findings;
}

// --- 3. Silent Return Null Detector ----------------------------------------

function detectSilentReturnNull(jsFiles) {
  var findings = [];

  for (var fi = 0; fi < jsFiles.length; fi++) {
    var file = jsFiles[fi];
    var lines = readFileLines(file);

    for (var i = 0; i < lines.length; i++) {
      if (/return\s+null\s*;/.test(lines[i])) {
        var hasWarning = false;
        for (var j = Math.max(0, i - 5); j < i; j++) {
          if (/console\.(warn|error|log)/.test(lines[j])) {
            hasWarning = true;
            break;
          }
        }

        if (!hasWarning) {
          var funcName = null;
          for (var j2 = i; j2 >= Math.max(0, i - 50); j2--) {
            var funcMatch = lines[j2].match(/(?:function\s+(\w*(?:Request|Handler)\w*)|(\w*(?:Request|Handler)\w*)\s*[=:]\s*(?:async\s+)?function)/i);
            if (funcMatch) {
              funcName = funcMatch[1] || funcMatch[2];
              break;
            }
          }

          if (funcName) {
            findings.push({
              severity: "MEDIUM",
              category: "silent exit",
              message: funcName + "() returns null without warning at " + relPath(file) + ":" + (i + 1),
            });
          }
        }
      }
    }
  }

  return findings;
}

// --- 4. Undefined Global Function Detector ---------------------------------

function detectUndefinedGlobals(jsFiles) {
  var findings = [];

  var definedFunctions = new Set();
  var defPatterns = [
    /function\s+([a-zA-Z_$]\w*)/g,
    /(?:var|let|const)\s+([a-zA-Z_$]\w*)\s*=\s*(?:async\s+)?function/g,
    /(?:var|let|const)\s+([a-zA-Z_$]\w*)\s*=\s*(?:async\s+)?\(/g,
    /(?:var|let|const)\s+([a-zA-Z_$]\w*)\s*=\s*(?:async\s+)?\w+\s*=>/g,
    /([a-zA-Z_$]\w*)\s*:\s*(?:async\s+)?function/g,
  ];

  for (var fi = 0; fi < jsFiles.length; fi++) {
    var lines = readFileLines(jsFiles[fi]);
    for (var li = 0; li < lines.length; li++) {
      for (var pi = 0; pi < defPatterns.length; pi++) {
        var match;
        defPatterns[pi].lastIndex = 0;
        while ((match = defPatterns[pi].exec(lines[li])) !== null) {
          definedFunctions.add(match[1]);
        }
      }
    }
  }

  var callPattern = /([a-z_$][a-zA-Z_$\d]*)\s*\(/g;
  var called = new Map();
  var keywords = new Set([
    "if", "for", "while", "switch", "catch", "return", "typeof", "new",
    "var", "let", "const", "else", "case", "delete", "void", "throw",
    "import", "export", "from", "class", "extends", "super", "yield",
    "await", "async", "function", "try", "finally", "with", "debugger",
    "instanceof", "this", "null", "undefined", "true", "false",
  ]);

  for (var fi2 = 0; fi2 < jsFiles.length; fi2++) {
    var file = jsFiles[fi2];
    var cLines = readFileLines(file);
    for (var i = 0; i < cLines.length; i++) {
      var line = cLines[i];
      var trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;

      var m;
      callPattern.lastIndex = 0;
      while ((m = callPattern.exec(line)) !== null) {
        var funcName = m[1];

        if (BUILTIN_GLOBALS.has(funcName)) continue;
        if (keywords.has(funcName)) continue;
        if (funcName.length < 3) continue;
        var before = line.substring(0, m.index);
        if (/\.\s*$/.test(before)) continue;

        if (!called.has(funcName)) called.set(funcName, []);
        called.get(funcName).push({ file: relPath(file), line: i + 1 });
      }
    }
  }

  called.forEach(function (refs, funcName) {
    if (!definedFunctions.has(funcName)) {
      var r = refs[0];
      findings.push({
        severity: "HIGH",
        category: "undefined function",
        message: funcName + "() called in " + r.file + ":" + r.line + " but never defined" + (refs.length > 1 ? " (" + refs.length + " total references)" : ""),
      });
    }
  });

  return findings;
}

// --- Main ------------------------------------------------------------------

function main() {
  console.log("=== SparkSuite Missing Handler Detector ===\n");

  if (!fs.existsSync(JS_DIR)) {
    console.error("ERROR: js/ directory not found at " + JS_DIR);
    process.exit(1);
  }

  var jsFiles = collectFiles(JS_DIR, ".js");
  var htmlFiles = collectFiles(HTML_DIR, ".html");

  console.log("Scanning " + jsFiles.length + " .js files and " + htmlFiles.length + " .html files...\n");

  var allFindings = [].concat(
    detectSparkCoreGaps(jsFiles),
    detectActGaps(jsFiles, htmlFiles),
    detectSilentReturnNull(jsFiles),
    detectUndefinedGlobals(jsFiles)
  );

  var critical = allFindings.filter(function (f) { return f.severity === "CRITICAL"; });
  var high = allFindings.filter(function (f) { return f.severity === "HIGH"; });
  var medium = allFindings.filter(function (f) { return f.severity === "MEDIUM"; });

  if (critical.length > 0) {
    console.log("--- CRITICAL ---");
    for (var i = 0; i < critical.length; i++) {
      console.log("[" + critical[i].category + "] " + critical[i].message);
    }
    console.log("");
  }

  if (high.length > 0) {
    console.log("--- HIGH ---");
    for (var i = 0; i < high.length; i++) {
      console.log("[" + high[i].category + "] " + high[i].message);
    }
    console.log("");
  }

  if (medium.length > 0) {
    console.log("--- MEDIUM ---");
    for (var i = 0; i < medium.length; i++) {
      console.log("[" + medium[i].category + "] " + medium[i].message);
    }
    console.log("");
  }

  if (allFindings.length === 0) {
    console.log("No issues found.\n");
  }

  console.log("=== Summary ===");
  console.log("CRITICAL: " + critical.length + "  HIGH: " + high.length + "  MEDIUM: " + medium.length);

  process.exit(critical.length > 0 ? 1 : 0);
}

main();
