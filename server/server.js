const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 3456;
const SPOTIFY_ACCOUNT_KEY = 'local';

app.use(cors({ origin: ['http://localhost:3456', 'app://localhost', 'file://'] }));
app.use(express.json({ limit: '100kb' }));

// ===== RATE LIMITING =====
// Simple in-memory rate limiter (per IP, per route group)
var _rateLimits = {};
var RATE_WINDOW = 60000; // 1 minute
var RATE_MAX_READ = 60;   // 60 reads/min
var RATE_MAX_WRITE = 5;   // 5 writes/min
var RATE_MAX_VOTE = 10;   // 10 votes/min

function rateLimit(req, res, group, max) {
  var ip = req.ip || req.connection.remoteAddress || 'unknown';
  var key = ip + ':' + group;
  var now = Date.now();
  if (!_rateLimits[key] || now - _rateLimits[key].start > RATE_WINDOW) {
    _rateLimits[key] = { start: now, count: 1 };
    return false;
  }
  _rateLimits[key].count++;
  if (_rateLimits[key].count > max) {
    res.status(429).json({ error: 'Too many requests. Try again later.' });
    return true;
  }
  return false;
}

// Clean up stale rate limit entries every 5 minutes
setInterval(function() {
  var now = Date.now();
  for (var key in _rateLimits) {
    if (now - _rateLimits[key].start > RATE_WINDOW * 2) {
      delete _rateLimits[key];
    }
  }
}, 300000);

// ===== VOTE DEDUPLICATION =====
// Track votes per IP per song (in-memory, resets on restart)
var _voteTracker = {};

// Clean up stale vote tracker entries every 30 minutes
setInterval(function() {
  var now = Date.now();
  for (var key in _voteTracker) {
    if (now - _voteTracker[key] > 3600000) {
      delete _voteTracker[key];
    }
  }
}, 1800000);

// ===== INPUT VALIDATION =====
function sanitizeString(str, maxLen) {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, maxLen || 200)
    .replace(/<[^>]*>/g, '');
}

function validateJSON(str) {
  try { JSON.parse(str); return true; } catch (e) { return false; }
}

function getSpotifyConfig() {
  return {
    clientId: process.env.SPOTIFY_CLIENT_ID || '',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || ('http://localhost:' + PORT + '/api/spotify/callback'),
    scopes: process.env.SPOTIFY_SCOPES || 'playlist-modify-private playlist-read-private'
  };
}

function hasSpotifyConfig() {
  var config = getSpotifyConfig();
  return !!(config.clientId && config.clientSecret && config.redirectUri);
}

function encodeSpotifyState(payload) {
  return Buffer.from(JSON.stringify(payload || {}), 'utf8').toString('base64url');
}

function decodeSpotifyState(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
  } catch (err) {
    return {};
  }
}

function getSpotifyAccount() {
  return db.prepare('SELECT * FROM spotify_accounts WHERE account_key = ?').get(SPOTIFY_ACCOUNT_KEY) || null;
}

function saveSpotifyAccount(account) {
  db.prepare(`
    INSERT INTO spotify_accounts (
      account_key,
      spotify_user_id,
      access_token,
      refresh_token,
      token_type,
      scopes,
      expires_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(account_key) DO UPDATE SET
      spotify_user_id=excluded.spotify_user_id,
      access_token=excluded.access_token,
      refresh_token=excluded.refresh_token,
      token_type=excluded.token_type,
      scopes=excluded.scopes,
      expires_at=excluded.expires_at,
      updated_at=CURRENT_TIMESTAMP
  `).run(
    SPOTIFY_ACCOUNT_KEY,
    account.spotify_user_id || null,
    account.access_token,
    account.refresh_token || null,
    account.token_type || 'Bearer',
    account.scopes || '',
    account.expires_at || null
  );
}

function clearSpotifyAccount() {
  db.prepare('DELETE FROM spotify_accounts WHERE account_key = ?').run(SPOTIFY_ACCOUNT_KEY);
  db.prepare('DELETE FROM spotify_playlists').run();
}

function listSpotifyPlaylists() {
  return db.prepare(`
    SELECT curriculum_key, playlist_id, playlist_name, sync_mode, last_snapshot_id,
           last_sync_status, last_sync_at, last_error
    FROM spotify_playlists
    ORDER BY curriculum_key ASC
  `).all();
}

function getSpotifyPlaylist(curriculumKey) {
  return db.prepare('SELECT * FROM spotify_playlists WHERE curriculum_key = ?').get(curriculumKey) || null;
}

function saveSpotifyPlaylist(record) {
  db.prepare(`
    INSERT INTO spotify_playlists (
      curriculum_key,
      playlist_id,
      playlist_name,
      sync_mode,
      last_snapshot_id,
      last_sync_status,
      last_sync_at,
      last_error,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(curriculum_key) DO UPDATE SET
      playlist_id=excluded.playlist_id,
      playlist_name=excluded.playlist_name,
      sync_mode=excluded.sync_mode,
      last_snapshot_id=excluded.last_snapshot_id,
      last_sync_status=excluded.last_sync_status,
      last_sync_at=excluded.last_sync_at,
      last_error=excluded.last_error,
      updated_at=CURRENT_TIMESTAMP
  `).run(
    record.curriculum_key,
    record.playlist_id,
    record.playlist_name || null,
    record.sync_mode || 'append_missing',
    record.last_snapshot_id || null,
    record.last_sync_status || 'idle',
    record.last_sync_at || null,
    record.last_error || null
  );
}

function sanitizeSpotifyTrackUri(value) {
  if (typeof value !== 'string') return '';
  value = value.trim();
  return /^spotify:track:[A-Za-z0-9]+$/.test(value) ? value : '';
}

function normalizeSpotifyTrackList(items) {
  var list = Array.isArray(items) ? items : [];
  var output = [];
  var i;
  var entry;
  var uri;
  var title;
  var artist;
  for (i = 0; i < list.length; i++) {
    entry = list[i];
    uri = sanitizeSpotifyTrackUri(typeof entry === 'string' ? entry : (entry && entry.uri));
    title = sanitizeString(entry && entry.title ? entry.title : '', 200);
    artist = sanitizeString(entry && entry.artist ? entry.artist : '', 200);
    if (!uri && !title) continue;
    output.push({
      uri: uri,
      title: title,
      artist: artist,
      id: sanitizeString(entry && entry.id ? entry.id : '', 200)
    });
  }
  return output;
}

async function exchangeSpotifyCode(code) {
  var config = getSpotifyConfig();
  var body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret
  });
  var response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
  var tokenData = await response.json();
  if (!response.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange Spotify authorization code');
  }
  return tokenData;
}

async function refreshSpotifyAccessToken(account) {
  var config = getSpotifyConfig();
  var body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: account.refresh_token,
    client_id: config.clientId,
    client_secret: config.clientSecret
  });
  var response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
  var tokenData = await response.json();
  if (!response.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || tokenData.error || 'Failed to refresh Spotify token');
  }
  saveSpotifyAccount({
    spotify_user_id: account.spotify_user_id,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || account.refresh_token,
    token_type: tokenData.token_type || 'Bearer',
    scopes: tokenData.scope || account.scopes || '',
    expires_at: Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600)
  });
  return getSpotifyAccount();
}

async function ensureSpotifyAccount() {
  var account = getSpotifyAccount();
  if (!account) throw new Error('Spotify account is not connected');
  if (account.expires_at && account.refresh_token && Math.floor(Date.now() / 1000) >= account.expires_at - 30) {
    account = await refreshSpotifyAccessToken(account);
  }
  return account;
}

async function spotifyFetch(path, options) {
  options = options || {};
  var account = await ensureSpotifyAccount();
  var headers = Object.assign({}, options.headers || {});
  headers.Authorization = 'Bearer ' + account.access_token;
  if (options.body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  var response = await fetch('https://api.spotify.com/v1' + path, Object.assign({}, options, { headers: headers }));
  if (response.status === 401 && account.refresh_token) {
    account = await refreshSpotifyAccessToken(account);
    headers.Authorization = 'Bearer ' + account.access_token;
    response = await fetch('https://api.spotify.com/v1' + path, Object.assign({}, options, { headers: headers }));
  }
  if (!response.ok) {
    var text = await response.text();
    throw new Error('Spotify API ' + response.status + ': ' + text);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function fetchSpotifyProfile() {
  return spotifyFetch('/me');
}

async function createSpotifyPlaylist(input) {
  var playlist = await spotifyFetch('/me/playlists', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      description: input.description || '',
      public: !!input.public
    })
  });
  saveSpotifyPlaylist({
    curriculum_key: input.curriculumKey,
    playlist_id: playlist.id,
    playlist_name: playlist.name,
    sync_mode: input.syncMode || 'append_missing',
    last_snapshot_id: playlist.snapshot_id || null,
    last_sync_status: 'idle',
    last_sync_at: null,
    last_error: null
  });
  return playlist;
}

async function fetchAllPlaylistTrackUris(playlistId) {
  var uris = [];
  var offset = 0;
  var page;
  do {
    page = await spotifyFetch('/playlists/' + encodeURIComponent(playlistId) + '/items?fields=items(track(uri)),next&limit=100&offset=' + offset);
    (page.items || []).forEach(function(item) {
      var uri = sanitizeSpotifyTrackUri(item && item.track ? item.track.uri : '');
      if (uri) uris.push(uri);
    });
    offset += page.items ? page.items.length : 0;
  } while (page && page.next);
  return uris;
}

async function searchSpotifyTrackByText(title, artist) {
  var query = '';
  var items;
  if (title) query += 'track:' + title;
  if (artist) query += (query ? ' ' : '') + 'artist:' + artist;
  if (!query) return null;
  items = await spotifyFetch('/search?type=track&limit=5&q=' + encodeURIComponent(query));
  items = items && items.tracks && Array.isArray(items.tracks.items) ? items.tracks.items : [];
  return items.length ? items[0] : null;
}

async function resolveSpotifyTrackEntries(items) {
  var list = normalizeSpotifyTrackList(items);
  var seen = {};
  var resolved = [];
  var unresolved = [];
  var i;
  var entry;
  var match;
  for (i = 0; i < list.length; i++) {
    entry = list[i];
    if (!entry.uri) {
      match = await searchSpotifyTrackByText(entry.title, entry.artist);
      if (match && sanitizeSpotifyTrackUri(match.uri)) {
        entry.uri = sanitizeSpotifyTrackUri(match.uri);
      }
    }
    if (!entry.uri) {
      unresolved.push({
        title: entry.title,
        artist: entry.artist,
        id: entry.id
      });
      continue;
    }
    if (seen[entry.uri]) continue;
    seen[entry.uri] = true;
    resolved.push(entry);
  }
  return {
    resolved: resolved,
    unresolved: unresolved
  };
}

function buildSpotifyStatusPayload() {
  var account = getSpotifyAccount();
  var playlists = listSpotifyPlaylists();
  var lastSyncAt = null;
  playlists.forEach(function(entry) {
    if (entry.last_sync_at && (!lastSyncAt || entry.last_sync_at > lastSyncAt)) lastSyncAt = entry.last_sync_at;
  });
  return {
    connected: !!account,
    spotifyUserId: account ? account.spotify_user_id : null,
    scopes: account && account.scopes ? account.scopes.split(/\s+/).filter(Boolean) : [],
    playlists: playlists,
    lastSyncAt: lastSyncAt
  };
}

app.get('/api/spotify/connect-url', (req, res) => {
  if (rateLimit(req, res, 'read', RATE_MAX_READ)) return;
  if (!hasSpotifyConfig()) {
    return res.status(503).json({ error: 'Spotify server auth is not configured' });
  }
  var config = getSpotifyConfig();
  var authUrl = 'https://accounts.spotify.com/authorize'
    + '?client_id=' + encodeURIComponent(config.clientId)
    + '&response_type=code'
    + '&redirect_uri=' + encodeURIComponent(config.redirectUri)
    + '&scope=' + encodeURIComponent(config.scopes)
    + '&show_dialog=false'
    + '&state=' + encodeURIComponent(encodeSpotifyState({
      returnTo: sanitizeString(req.query.returnTo || '', 500)
    }));
  res.json({ authUrl: authUrl });
});

app.get('/api/spotify/callback', async (req, res) => {
  var state = decodeSpotifyState(req.query.state || '');
  var returnTo = typeof state.returnTo === 'string' ? state.returnTo : '';
  var redirectUrl = returnTo ? (returnTo + (returnTo.indexOf('?') === -1 ? '?' : '&')) : '';

  if (req.query.error) {
    if (redirectUrl) return res.redirect(redirectUrl + 'spotify_error=' + encodeURIComponent(req.query.error));
    return res.status(400).send('Spotify authorization failed: ' + req.query.error);
  }
  if (!req.query.code) {
    if (redirectUrl) return res.redirect(redirectUrl + 'spotify_error=missing_code');
    return res.status(400).send('Spotify authorization code missing');
  }

  try {
    var tokenData = await exchangeSpotifyCode(req.query.code);
    saveSpotifyAccount({
      spotify_user_id: null,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_type: tokenData.token_type || 'Bearer',
      scopes: tokenData.scope || getSpotifyConfig().scopes,
      expires_at: Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600)
    });
    var profile = await fetchSpotifyProfile();
    var account = getSpotifyAccount();
    saveSpotifyAccount({
      spotify_user_id: profile && profile.id ? profile.id : null,
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      token_type: account.token_type,
      scopes: account.scopes,
      expires_at: account.expires_at
    });
    if (redirectUrl) return res.redirect(redirectUrl + 'spotify=connected');
    return res.send('Spotify connected. You can close this tab.');
  } catch (err) {
    if (redirectUrl) return res.redirect(redirectUrl + 'spotify_error=' + encodeURIComponent(err.message));
    return res.status(500).send(err.message);
  }
});

app.get('/api/spotify/status', async (req, res) => {
  if (rateLimit(req, res, 'read', RATE_MAX_READ)) return;
  try {
    if (getSpotifyAccount()) await ensureSpotifyAccount();
    res.json(buildSpotifyStatusPayload());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/spotify/disconnect', (req, res) => {
  if (rateLimit(req, res, 'write', RATE_MAX_WRITE)) return;
  clearSpotifyAccount();
  res.json({ ok: true, connected: false });
});

app.post('/api/spotify/playlists/:curriculumKey/create', async (req, res) => {
  if (rateLimit(req, res, 'write', RATE_MAX_WRITE)) return;
  try {
    await ensureSpotifyAccount();
    var curriculumKey = sanitizeString(req.params.curriculumKey, 120);
    if (!curriculumKey) return res.status(400).json({ error: 'Curriculum key is required' });
    var playlist = await createSpotifyPlaylist({
      curriculumKey: curriculumKey,
      name: sanitizeString(req.body.name, 200) || ('SparkSuite - ' + curriculumKey),
      description: sanitizeString(req.body.description, 300),
      public: !!req.body.public,
      syncMode: sanitizeString(req.body.syncMode, 40) || 'append_missing'
    });
    res.json({
      ok: true,
      playlist: {
        curriculum_key: curriculumKey,
        playlist_id: playlist.id,
        playlist_name: playlist.name,
        last_snapshot_id: playlist.snapshot_id || null
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/spotify/playlists/:curriculumKey/sync', async (req, res) => {
  if (rateLimit(req, res, 'write', RATE_MAX_WRITE)) return;
  var curriculumKey = sanitizeString(req.params.curriculumKey, 120);
  try {
    await ensureSpotifyAccount();
    var syncMode = sanitizeString(req.body.syncMode, 40) || 'append_missing';
    var resolvedTracks = await resolveSpotifyTrackEntries(req.body.tracks);
    var tracks = resolvedTracks.resolved;
    var unresolvedTracks = resolvedTracks.unresolved;
    var desiredUris = tracks.map(function(track) { return track.uri; });
    var playlistRecord;
    var playlistId;
    var existingUris;
    var existingSet = {};
    var missingUris = [];
    var snapshot = null;
    var i;

    if (!curriculumKey) return res.status(400).json({ error: 'Curriculum key is required' });
    if (!desiredUris.length) return res.status(400).json({ error: 'No Spotify tracks could be resolved from the supplied curriculum songs' });

    playlistRecord = getSpotifyPlaylist(curriculumKey);
    if (!playlistRecord) {
      if (req.body.createIfMissing === false) {
        return res.status(404).json({ error: 'No linked playlist for curriculum' });
      }
      await createSpotifyPlaylist({
        curriculumKey: curriculumKey,
        name: sanitizeString(req.body.name, 200) || ('SparkSuite - ' + curriculumKey),
        description: sanitizeString(req.body.description, 300),
        public: !!req.body.public,
        syncMode: syncMode
      });
      playlistRecord = getSpotifyPlaylist(curriculumKey);
    }

    playlistId = playlistRecord.playlist_id;
    existingUris = await fetchAllPlaylistTrackUris(playlistId);
    existingUris.forEach(function(uri) { existingSet[uri] = true; });
    for (i = 0; i < desiredUris.length; i++) {
      if (!existingSet[desiredUris[i]]) missingUris.push(desiredUris[i]);
    }

    if (syncMode === 'replace_exact') {
      snapshot = await spotifyFetch('/playlists/' + encodeURIComponent(playlistId) + '/items', {
        method: 'PUT',
        body: JSON.stringify({ uris: desiredUris })
      });
    } else {
      for (i = 0; i < missingUris.length; i += 100) {
        snapshot = await spotifyFetch('/playlists/' + encodeURIComponent(playlistId) + '/items', {
          method: 'POST',
          body: JSON.stringify({ uris: missingUris.slice(i, i + 100) })
        });
      }
    }

    saveSpotifyPlaylist({
      curriculum_key: curriculumKey,
      playlist_id: playlistId,
      playlist_name: playlistRecord.playlist_name || sanitizeString(req.body.name, 200) || ('SparkSuite - ' + curriculumKey),
      sync_mode: syncMode,
      last_snapshot_id: snapshot && snapshot.snapshot_id ? snapshot.snapshot_id : playlistRecord.last_snapshot_id,
      last_sync_status: 'ok',
      last_sync_at: new Date().toISOString(),
      last_error: null
    });

    res.json({
      ok: true,
      curriculumKey: curriculumKey,
      playlistId: playlistId,
      syncMode: syncMode,
      resolvedCount: tracks.length,
      unresolvedCount: unresolvedTracks.length,
      unresolvedTracks: unresolvedTracks,
      desiredCount: desiredUris.length,
      existingCount: existingUris.length,
      addedCount: syncMode === 'replace_exact' ? desiredUris.length : missingUris.length,
      skippedCount: syncMode === 'replace_exact' ? 0 : desiredUris.length - missingUris.length,
      snapshotId: snapshot && snapshot.snapshot_id ? snapshot.snapshot_id : null
    });
  } catch (err) {
    var existingRecord = curriculumKey ? getSpotifyPlaylist(curriculumKey) : null;
    if (existingRecord) {
      saveSpotifyPlaylist({
        curriculum_key: curriculumKey,
        playlist_id: existingRecord.playlist_id,
        playlist_name: existingRecord.playlist_name,
        sync_mode: sanitizeString(req.body && req.body.syncMode, 40) || existingRecord.sync_mode || 'append_missing',
        last_snapshot_id: existingRecord.last_snapshot_id,
        last_sync_status: 'error',
        last_sync_at: new Date().toISOString(),
        last_error: err.message
      });
    }
    res.status(500).json({ error: err.message });
  }
});

// Search songs (kept for backwards compat, main list already supports ?q=)
// NOTE: Must be registered BEFORE /api/songs/:id to avoid being captured by :id param
app.get('/api/songs/search', (req, res) => {
  if (rateLimit(req, res, 'read', RATE_MAX_READ)) return;

  const { q } = req.query;
  if (!q) return res.json([]);

  var safeQ = sanitizeString(q, 100);
  const songs = db.prepare(
    'SELECT * FROM songs WHERE title LIKE ? OR artist LIKE ? ORDER BY votes DESC LIMIT 20'
  ).all('%' + safeQ + '%', '%' + safeQ + '%');

  res.json(songs);
});

// List songs (with optional search and sort)
app.get('/api/songs', (req, res) => {
  if (rateLimit(req, res, 'read', RATE_MAX_READ)) return;

  const { q, sort } = req.query;
  let sql = 'SELECT * FROM songs';
  const params = [];

  if (q) {
    sql += ' WHERE title LIKE ? OR artist LIKE ?';
    var safeQ = sanitizeString(q, 100);
    params.push('%' + safeQ + '%', '%' + safeQ + '%');
  }

  if (sort === 'newest') {
    sql += ' ORDER BY created_at DESC';
  } else {
    sql += ' ORDER BY votes DESC, created_at DESC';
  }

  sql += ' LIMIT 50';

  const songs = db.prepare(sql).all(...params);
  res.json(songs);
});

// Get single song
app.get('/api/songs/:id', (req, res) => {
  if (rateLimit(req, res, 'read', RATE_MAX_READ)) return;

  const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(req.params.id);
  if (!song) return res.status(404).json({ error: 'Song not found' });
  res.json(song);
});

// Submit a new song
app.post('/api/songs', (req, res) => {
  if (rateLimit(req, res, 'write', RATE_MAX_WRITE)) return;

  var title = sanitizeString(req.body.title, 200);
  var artist = sanitizeString(req.body.artist, 200);
  var chords = req.body.chords;
  var progression = req.body.progression;
  var pattern = req.body.pattern;
  var bpm = parseInt(req.body.bpm) || 100;
  var level = parseInt(req.body.level) || 1;
  var submitted_by = sanitizeString(req.body.submitted_by, 100) || 'Anonymous';

  if (!title || !artist) {
    return res.status(400).json({ error: 'Title and artist are required' });
  }
  if (!chords || !validateJSON(chords)) {
    return res.status(400).json({ error: 'Invalid chords format (must be JSON array)' });
  }
  if (!progression || !validateJSON(progression)) {
    return res.status(400).json({ error: 'Invalid progression format (must be JSON array)' });
  }
  if (bpm < 20 || bpm > 300) {
    return res.status(400).json({ error: 'BPM must be between 20 and 300' });
  }
  if (level < 1 || level > 3) {
    return res.status(400).json({ error: 'Level must be 1, 2, or 3' });
  }

  const result = db.prepare(`
    INSERT INTO songs (title, artist, chords, progression, pattern, bpm, level, submitted_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title, artist, chords, progression,
    (pattern && validateJSON(pattern)) ? pattern : '["D","D","U","U","D","U"]',
    bpm, level, submitted_by
  );

  res.json({ id: result.lastInsertRowid, message: 'Song submitted!' });
});

// Upvote a song (with per-IP deduplication)
app.post('/api/songs/:id/vote', (req, res) => {
  if (rateLimit(req, res, 'vote', RATE_MAX_VOTE)) return;

  var ip = req.ip || req.connection.remoteAddress || 'unknown';
  var songId = req.params.id;
  var voteKey = ip + ':' + songId;

  // Check if this IP already voted for this song
  if (_voteTracker[voteKey]) {
    return res.status(409).json({ error: 'Already voted for this song' });
  }

  const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(songId);
  if (!song) return res.status(404).json({ error: 'Song not found' });

  db.prepare('UPDATE songs SET votes = votes + 1 WHERE id = ?').run(songId);
  _voteTracker[voteKey] = Date.now();
  res.json({ votes: song.votes + 1 });
});

app.listen(PORT, () => {
  console.log('ChordSpark Community Server running on http://localhost:' + PORT);
});
