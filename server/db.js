const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'songs.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    chords TEXT NOT NULL,
    progression TEXT NOT NULL,
    pattern TEXT NOT NULL DEFAULT '["D","D","U","U","D","U"]',
    bpm INTEGER DEFAULT 100,
    level INTEGER DEFAULT 1,
    votes INTEGER DEFAULT 0,
    submitted_by TEXT DEFAULT 'Anonymous',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Seed with initial community songs if table is empty
const count = db.prepare('SELECT COUNT(*) as n FROM songs').get();
if (count.n === 0) {
  const insert = db.prepare(`
    INSERT INTO songs (title, artist, chords, progression, pattern, bpm, level, votes, submitted_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seeds = [
    ['Stand By Me', 'Ben E. King', '["A","F#m","D","E"]', '["A","A","F#m","F#m","D","E","A","A"]', '["D","D","U","U","D","U"]', 120, 2, 12, 'ChordSpark'],
    ['Hey Jude', 'The Beatles', '["D","A","A7","G"]', '["D","D","A","A","A7","A7","D","D","D","D","G","G","A7","A7","D","D"]', '["D","D","U","U","D","U"]', 74, 2, 10, 'ChordSpark'],
    ['Riptide', 'Vance Joy', '["Am","G","C"]', '["Am","G","C","C","Am","G","C","C"]', '["D","U","D","U","D","U","D","U"]', 102, 2, 8, 'ChordSpark'],
    ['Love Me Do', 'The Beatles', '["G","C","D"]', '["G","C","G","G","C","G","D","C","G","G"]', '["D","D","U","U","D","U"]', 148, 1, 7, 'ChordSpark'],
    ['Hallelujah', 'Leonard Cohen', '["C","Am","F","G","E7"]', '["C","Am","C","Am","F","G","C","G","C","F","G","Am","F","Am","F","G","C","G","C"]', '["D","x","U","x","U","D","x","U"]', 56, 2, 15, 'ChordSpark'],
    ['Zombie', 'The Cranberries', '["Em","C","G","D"]', '["Em","C","G","D","Em","C","G","D"]', '["D","D","U","U","D","U"]', 84, 2, 6, 'ChordSpark'],
    ['Brown Eyed Girl', 'Van Morrison', '["G","C","D","Em"]', '["G","C","G","D","G","C","G","D","C","D","G","Em","C","D","G","G"]', '["D","D","U","U","D","U"]', 150, 2, 9, 'ChordSpark'],
    ['Blowin in the Wind', 'Bob Dylan', '["G","C","D"]', '["G","C","G","G","G","C","D","D","G","C","G","G","G","C","D","D","C","D","G","G","C","D","G","G"]', '["D","D","U","U","D","U"]', 80, 1, 5, 'ChordSpark']
  ];

  const insertMany = db.transaction((songs) => {
    for (const song of songs) {
      insert.run(...song);
    }
  });
  insertMany(seeds);
}

module.exports = db;
