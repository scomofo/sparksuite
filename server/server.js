const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 3456;

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
