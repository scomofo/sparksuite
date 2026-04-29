var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function test(name, fn) {
  Promise.resolve()
    .then(fn)
    .then(function() {
      console.log("  PASS: " + name);
    })
    .catch(function(err) {
      console.error("  FAIL: " + name);
      console.error("    " + (err && err.stack ? err.stack : err));
      process.exitCode = 1;
    });
}

console.log("\n--- Spotify Playlist Sync ---");

test("Spotify playlist client calls the expected sync endpoint", function() {
  global.window = global;
  var requests = [];
  global.fetch = function(url, options) {
    requests.push({ url: url, options: options || {} });
    return Promise.resolve({
      ok: true,
      text: function() {
        return Promise.resolve(JSON.stringify({ ok: true, playlistId: "playlist_1" }));
      }
    });
  };

  global.eval(loadJS("js/sparksuite/network/spotify_playlist_client.js"));
  var client = new SparkSpotifyPlaylistClient({ baseUrl: "http://localhost:3456/api/spotify" });
  return client.syncCurriculumPlaylist({
    curriculumKey: "guitar_core",
    name: "SparkSuite - Guitar",
    tracks: [{ uri: "spotify:track:abc123" }]
  }).then(function() {
    assert.strictEqual(requests.length, 1);
    assert.strictEqual(requests[0].url, "http://localhost:3456/api/spotify/playlists/guitar_core/sync");
    assert.strictEqual(requests[0].options.method, "POST");
    assert.ok(JSON.parse(requests[0].options.body).tracks.length === 1);
  });
});

test("SparkCore syncSpotifyCurriculumPlaylist updates playlist runtime state", function() {
  global.window = global;
  global.SparkCore = function SparkCore() {
    this.runtimeState = {
      spotifyPlaylistConnected: false,
      spotifyPlaylistPlaylists: [],
      spotifyPlaylistLastSyncAt: null,
      spotifyPlaylistLastResult: null,
      spotifyPlaylistUnresolvedTracks: [],
      spotifyPlaylistSyncStatus: "idle",
      spotifyPlaylistError: null
    };
  };
  global.SparkCore.prototype.updateRuntimeState = function(patch) {
    var key;
    for (key in patch) this.runtimeState[key] = patch[key];
  };
  global.SparkCore.prototype.cloneValue = function(value) {
    return JSON.parse(JSON.stringify(value));
  };

  global.eval(loadJS("js/sparksuite/core/spotify_playlist_sync.js"));

  var core = new SparkCore();
  core.spotifyPlaylistClient = {
    syncCurriculumPlaylist: function() {
      return Promise.resolve({
        ok: true,
        playlistId: "playlist_1",
        unresolvedCount: 1,
        unresolvedTracks: [{ title: "Unknown Song", artist: "Unknown Artist" }]
      });
    },
    getStatus: function() {
      return Promise.resolve({
        connected: true,
        playlists: [{
          curriculum_key: "guitar_core",
          playlist_id: "playlist_1",
          playlist_name: "SparkSuite - Guitar",
          last_sync_status: "ok"
        }],
        lastSyncAt: "2026-04-22T20:00:00.000Z"
      });
    }
  };

  return core.syncSpotifyCurriculumPlaylist({
    curriculumKey: "guitar_core",
    tracks: [{ uri: "spotify:track:abc123" }]
  }).then(function(result) {
    assert.strictEqual(result.ok, true);
    assert.strictEqual(core.runtimeState.spotifyPlaylistConnected, true);
    assert.strictEqual(core.runtimeState.spotifyPlaylistPlaylists.length, 1);
    assert.strictEqual(core.runtimeState.spotifyPlaylistSyncStatus, "idle");
    assert.strictEqual(core.runtimeState.spotifyPlaylistError, null);
    assert.strictEqual(core.runtimeState.spotifyPlaylistUnresolvedTracks.length, 1);
    assert.strictEqual(core.runtimeState.spotifyPlaylistLastResult.unresolvedCount, 1);
  });
});

process.on("beforeExit", function(code) {
  if (code && code !== 0) process.exit(code);
});
