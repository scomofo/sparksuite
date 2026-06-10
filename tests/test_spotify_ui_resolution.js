var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function test(name, fn) {
  try {
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Spotify UI Resolution ---");

test("songs page routes spotify playlist buttons through app actions", function() {
  var songsSource = loadJS("js/pages/songs.js");
  assert.ok(songsSource.indexOf("act(\\'spotifyPlaylistConnect\\')") >= 0);
  assert.ok(songsSource.indexOf("act(\\'spotifyPlaylistCreate\\')") >= 0);
  assert.ok(songsSource.indexOf("act(\\'spotifyPlaylistSync\\')") >= 0);
});

test("utility family handles spotify playlist actions", function() {
  var utilitySource = loadJS("js/actions/utility_family.js");
  assert.ok(utilitySource.indexOf('if (a === "spotifyPlaylistConnect") {') >= 0);
  assert.ok(utilitySource.indexOf('if (typeof sparkSpotifyPlaylistConnect === "function") sparkSpotifyPlaylistConnect();') >= 0);
  assert.ok(utilitySource.indexOf('if (a === "spotifyPlaylistCreate") {') >= 0);
  assert.ok(utilitySource.indexOf('if (typeof sparkSpotifyPlaylistCreate === "function") sparkSpotifyPlaylistCreate();') >= 0);
  assert.ok(utilitySource.indexOf('if (a === "spotifyPlaylistSync") {') >= 0);
  assert.ok(utilitySource.indexOf('if (typeof sparkSpotifyPlaylistSync === "function") sparkSpotifyPlaylistSync();') >= 0);
});

if (process.exitCode) process.exit(process.exitCode);
