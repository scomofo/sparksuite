(function(){

  function getPreferredPerformanceArrangement(song, fallbackArrangement) {
    if (song && typeof song.preferredPerformanceArrangement === "string" && song.preferredPerformanceArrangement) {
      return song.preferredPerformanceArrangement;
    }
    return fallbackArrangement || "chords";
  }

  function buildPerformanceSongFromBuiltin(song) {
    if (!song) return null;
    return {
      id: (song.title || "song").toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      title: song.title,
      artist: song.artist || "Unknown",
      bpm: song.bpm || 100,
      chords: song.chords || [],
      progression: song.progression || [],
      pattern: song.pattern || ["D","D","U","U","D","U"],
      leadNotes: song.leadNotes || null,
      midi: song.midi || null,
      preferredPerformanceArrangement: getPreferredPerformanceArrangement(song, "chords"),
      source: "builtin"
    };
  }

  function buildPerformanceSongFromImported(song) {
    if (!song) return null;
    return {
      id: (song.title || "imported").toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      title: song.title,
      artist: song.artist || "Imported",
      bpm: song.bpm || 100,
      chords: song.chords || [],
      progression: song.progression || [],
      pattern: song.pattern || ["D","D","U","U","D","U"],
      preferredPerformanceArrangement: getPreferredPerformanceArrangement(song, "chords"),
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
      audio: perfSong.midi ? { type: "midi", src: perfSong.midi } : { type: "silent" },
      events: arrangement.events,
      phrases: phrases
    };
  }

  window.getPreferredPerformanceArrangement = getPreferredPerformanceArrangement;
  window.buildPerformanceSongFromBuiltin = buildPerformanceSongFromBuiltin;
  window.buildPerformanceSongFromImported = buildPerformanceSongFromImported;
  window.buildPerformanceChartFromSong = buildPerformanceChartFromSong;

})();
