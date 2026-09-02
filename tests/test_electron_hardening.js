/*
 * Main-process hardening for the desktop shell.
 *
 * The app is entirely local — index.html and its assets — so any navigation
 * away from it, or any window the renderer opens, is unexpected. These were
 * unguarded: no setWindowOpenHandler, no will-navigate handler, sandbox unset,
 * and the CSP was registered three lines AFTER loadFile(), which asynchrony
 * usually saved but which was a race by construction.
 *
 * Static assertions: launching Electron is not available in every environment
 * that runs this suite, and these are structural guarantees about main.js
 * rather than behaviour that changes at runtime.
 */
var assert = require("assert");
var fs = require("fs");
var path = require("path");

var repoRoot = path.resolve(__dirname, "..");
var main = fs.readFileSync(path.join(repoRoot, "main.js"), "utf8");
var indexHtml = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");

// Ordering assertions look at code only. Prose that mentions a call — such as
// the comment explaining why the CSP registration moved — must not count as
// an occurrence of it. Blank the comments rather than deleting, so offsets
// stay comparable.
var mainCode = main
  .replace(/\/\*[\s\S]*?\*\//g, function (m) { return m.replace(/[^\n]/g, " "); })
  .replace(/^([^\n"'`]*?)\/\/[^\n]*/gm, function (m, before) {
    return before + " ".repeat(m.length - before.length);
  });

var passed = 0;
function test(name, fn) {
  try { fn(); console.log("  PASS " + name); passed++; }
  catch (e) { console.error("  FAIL " + name + ": " + (e && e.message)); process.exitCode = 1; }
}

test("everything main.js uses from electron is imported", function() {
  var imported = /require\(['"]electron['"]\)/.test(main)
    ? (main.match(/const\s*\{([^}]+)\}\s*=\s*require\(['"]electron['"]\)/) || [null, ""])[1]
        .split(",").map(function (s) { return s.trim(); }).filter(Boolean)
    : [];
  ["app", "BrowserWindow", "ipcMain", "dialog", "session", "shell"].forEach(function (name) {
    if (new RegExp("(^|[^.\\w])" + name + "\\.").test(main)) {
      assert.ok(
        imported.indexOf(name) !== -1,
        name + " is used but not destructured from require('electron') — " +
          "node --check does not catch this, it fails at runtime"
      );
    }
  });
});

test("the renderer is sandboxed", function() {
  assert.ok(/sandbox:\s*true/.test(main), "webPreferences must set sandbox: true");
  assert.ok(/contextIsolation:\s*true/.test(main), "contextIsolation must stay on");
  assert.ok(/nodeIntegration:\s*false/.test(main), "nodeIntegration must stay off");
});

test("the CSP is registered before the page load is requested", function() {
  var cspIdx = mainCode.indexOf("onHeadersReceived");
  var loadIdx = mainCode.indexOf("loadFile(");
  assert.ok(cspIdx > -1 && loadIdx > -1);
  assert.ok(
    cspIdx < loadIdx,
    "onHeadersReceived must be registered before loadFile(), otherwise the " +
      "first document response can race the handler"
  );
});

test("the header CSP and the meta CSP are identical", function() {
  var header = (main.match(/const CONTENT_SECURITY_POLICY = "([^"]+)"/) || [])[1];
  var meta = (indexHtml.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/) || [])[1];
  assert.ok(header, "main.js must define CONTENT_SECURITY_POLICY");
  assert.ok(meta, "index.html must carry a CSP meta tag");
  assert.strictEqual(
    header, meta,
    "the two policies must match, or the effective policy depends on which applies"
  );
});

test("the CSP grants no remote origins", function() {
  var meta = (indexHtml.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/) || [])[1];
  var remotes = meta.match(/https?:\/\/[^\s;]+/g) || [];
  assert.deepStrictEqual(
    remotes, [],
    "fonts are self-hosted and nothing else is remote; a new grant here needs a reason: " +
      remotes.join(", ")
  );
});

test("renderer-opened windows are denied", function() {
  assert.ok(/setWindowOpenHandler/.test(main), "must install a window-open handler");
  assert.ok(
    /action:\s*['"]deny['"]/.test(main),
    "the handler must deny — otherwise window.open yields a second unconstrained Electron window"
  );
});

test("navigation away from the app document is blocked", function() {
  assert.ok(/on\(['"]will-navigate['"]/.test(main), "must handle will-navigate");
  assert.ok(/preventDefault\(\)/.test(main), "will-navigate must preventDefault");
});

test("only allowlisted https URLs reach the system browser", function() {
  assert.ok(/function isAllowedExternal/.test(main));
  var fn = main.slice(main.indexOf("function isAllowedExternal"));
  fn = fn.slice(0, fn.indexOf("\n}"));
  assert.ok(/protocol !== ['"]https:['"]/.test(fn), "non-https schemes must be refused");
  assert.ok(
    /startsWith\(prefix/.test(fn),
    "prefix matching must be anchored — a bare indexOf would let evil.com/?x=https://github.com/... through"
  );
});

// Behavioural check of the allowlist logic itself, extracted from main.js.
test("the allowlist accepts the releases page and refuses everything else", function() {
  var src = main.slice(main.indexOf("const ALLOWED_EXTERNAL_PREFIXES"));
  src = src.slice(0, src.indexOf("function hardenWindow"));
  var isAllowedExternal = new Function("URL", src + "; return isAllowedExternal;")(URL);

  assert.strictEqual(isAllowedExternal("https://github.com/scomofo/sparksuite"), true);
  assert.strictEqual(isAllowedExternal("https://github.com/scomofo/sparksuite/releases/latest"), true);

  [
    "http://github.com/scomofo/sparksuite",          // not https
    "https://github.com/scomofo/sparksuite-evil",    // prefix must end at a boundary
    "https://evil.com/https://github.com/scomofo/sparksuite",
    "https://github.com.evil.com/scomofo/sparksuite",
    "file:///etc/passwd",
    "javascript:alert(1)",
    "not a url",
    ""
  ].forEach(function (url) {
    assert.strictEqual(isAllowedExternal(url), false, url + " must be refused");
  });
});

console.log("PASS: electron main-process hardening (" + passed + " checks)");
