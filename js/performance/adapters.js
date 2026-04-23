(function(){

  function sanitizePerformanceSongId(value) {
    if (value == null) return "";
    return String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function normalizePerformanceSongText(value) {
    if (value == null) return "";
    return String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function findCanonicalPerformanceSongId(song) {
    var songs;
    var key;
    var entry;
    var targetTitle;
    var targetArtist;
    if (!song || typeof window === "undefined" || !window.SparkContent || !window.SparkContent.songs) return "";
    songs = window.SparkContent.songs;
    if (song.id && songs[song.id]) return sanitizePerformanceSongId(song.id);
    if (song.songId && songs[song.songId]) return sanitizePerformanceSongId(song.songId);
    targetTitle = normalizePerformanceSongText(song.title);
    targetArtist = normalizePerformanceSongText(song.artist);
    if (!targetTitle) return "";
    for (key in songs) {
      if (!Object.prototype.hasOwnProperty.call(songs, key)) continue;
      entry = songs[key] || {};
      if (normalizePerformanceSongText(entry.title) !== targetTitle) continue;
      if (targetArtist && normalizePerformanceSongText(entry.artist) !== targetArtist) continue;
      return sanitizePerformanceSongId(entry.id || key);
    }
    return "";
  }

  function resolvePerformanceSongId(song, fallbackTitle) {
    var explicitId;
    explicitId = sanitizePerformanceSongId(
      (song && (song.id || song.songId || song.contentSongId || song.performanceSongId)) ||
      fallbackTitle ||
      (song && song.title) ||
      "song"
    );
    return findCanonicalPerformanceSongId(song) || explicitId || "song";
  }

  function getActivePerformanceInstrumentType() {
    var active;
    var all;
    var i;
    var entry;
    var candidate;
    if (typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getActive !== "function") {
      return "guitar";
    }
    active = SparkInstruments.getActive();
    if (!active) return "guitar";
    if (active.instrument || active.instrumentType) return active.instrument || active.instrumentType;
    candidate = active.id || active.appId || active.instrumentId || null;
    if (!candidate || typeof SparkInstruments.getAll !== "function") return "guitar";
    all = SparkInstruments.getAll() || [];
    for (i = 0; i < all.length; i++) {
      entry = all[i] || {};
      if (entry.id === candidate || entry.appId === candidate) {
        return entry.instrument || entry.instrumentType || "guitar";
      }
    }
    return "guitar";
  }

  function buildPerformanceSongFromBuiltin(song) {
    if (!song) return null;
    return {
      id: resolvePerformanceSongId(song, song && song.title),
      title: song.title,
      artist: song.artist || "Unknown",
      bpm: song.bpm || 100,
      chords: song.chords || [],
      progression: song.progression || [],
      pattern: song.pattern || ["D","D","U","U","D","U"],
      leadNotes: song.leadNotes || null,
      midi: song.midi || null,
      audio: song.audio || null,
      instrument: song.instrument || song.instrumentType || song.adapterType || getActivePerformanceInstrumentType(),
      source: "builtin"
    };
  }

  function buildPerformanceSongFromImported(song) {
    if (!song) return null;
    return {
      id: resolvePerformanceSongId(song, song && song.title),
      title: song.title,
      artist: song.artist || "Imported",
      bpm: song.bpm || 100,
      chords: song.chords || [],
      progression: song.progression || [],
      pattern: song.pattern || ["D","D","U","U","D","U"],
      audio: song.audio || null,
      instrument: song.instrument || song.instrumentType || song.adapterType || getActivePerformanceInstrumentType(),
      source: "imported"
    };
  }

  function buildPerformanceChartFromSong(song, sourceType, arrangementType) {
    var perfSong;
    if (sourceType === "imported") {
      perfSong = buildPerformanceSongFromImported(song);
    } else {
      perfSong = buildPerformanceSongFromBuiltin(song);
    }
    if (!perfSong || !perfSong.progression.length) return null;

    arrangementType = arrangementType || "chords";
    var arrangement, phrases;

    if (arrangementType === "rhythm_chords") {
      arrangement = buildRhythmChordArrangement(perfSong);
      phrases = buildPhraseMarkersFromBars(perfSong, 4);
    } else if (arrangementType === "lead" && perfSong.leadNotes) {
      arrangement = buildLeadArrangement(perfSong, perfSong.leadNotes);
      phrases = arrangement ? buildPhraseMarkers(arrangement) : [];
    } else {
      arrangement = buildChordArrangement(perfSong);
      phrases = buildPhraseMarkers(arrangement);
    }

    if (!arrangement) return null;

    return {
      id: perfSong.id + "_" + arrangementType,
      title: perfSong.title,
      artist: perfSong.artist,
      bpm: perfSong.bpm,
      beatsPerBar: 4,
      offsetSec: 0,
      arrangementType: arrangementType,
      instrument: perfSong.instrument || "guitar",
      adapterType: perfSong.instrument || "guitar",
      audio: perfSong.audio || (perfSong.midi ? { type: "midi", src: perfSong.midi } : { type: "silent" }),
      events: arrangement.events,
      phrases: phrases
    };
  }

  window.getActivePerformanceInstrumentType = getActivePerformanceInstrumentType;
  window.resolvePerformanceSongId = resolvePerformanceSongId;
  window.buildPerformanceSongFromBuiltin = buildPerformanceSongFromBuiltin;
  window.buildPerformanceSongFromImported = buildPerformanceSongFromImported;
  window.buildPerformanceChartFromSong = buildPerformanceChartFromSong;

})();
