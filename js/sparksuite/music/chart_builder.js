(function() {
  /**
   * SparkChartBuilder — builds SparkPlayAlongChart from analysis + patterns.
   * Generates both rhythm notes (SparkNoteEvent) and chord timelines.
   */
  function ChartBuilder() {}

  /**
   * Build a complete play-along chart.
   * @param {Object} params
   * @param {string} params.trackId
   * @param {number} params.bpm
   * @param {string} params.difficulty
   * @param {Object} params.patterns - { rhythm: [1,0,1,0], strumming: [...] }
   * @param {Array}  params.chords   - [{time, chord, duration}] from ChordProgressionEngine
   * @param {Object} params.analysis - full analysis from TrackAnalyzer
   * @returns {SparkPlayAlongChart}
   */
  ChartBuilder.prototype.build = function(params) {
    params = params || {};
    var trackId = params.trackId || "unknown";
    var bpm = params.bpm || 120;
    var difficulty = params.difficulty || "easy";
    var patterns = params.patterns || {};
    var chords = params.chords || [];
    var analysis = params.analysis || {};
    var durationMs = analysis.durationMs || 180000;

    var ppq = 480;
    var beatMs = 60000 / bpm;
    var rhythmPattern = patterns.rhythm || [1, 0, 1, 0];
    var totalBeats = Math.floor(durationMs / beatMs);
    var laneCount = difficulty === "hard" ? 5 : 4;

    // Build NoteEvent array from rhythm pattern
    var notes = [];
    var seed = hashCode(trackId);
    var rng = seededRandom(seed);

    for (var i = 0; i < totalBeats; i++) {
      var patIdx = i % rhythmPattern.length;
      if (!rhythmPattern[patIdx]) continue;

      var tick = Math.round(i * ppq);
      var lane = Math.floor(rng() * laneCount);

      notes.push(new SparkNoteEvent({
        id: "spa_" + i,
        tick: tick,
        tickLength: 0,
        lane: lane,
        laneMask: 1 << lane,
        flags: {},
        difficulty: difficulty,
        label: "",
        skillId: null
      }));
    }

    var tempoMap = new SparkTempoMap({ ppq: ppq, bpm: bpm });
    var songChart = new SparkSongChart({
      song: {
        id: trackId,
        title: analysis.title || "Spotify Track",
        artist: analysis.artist || "Unknown",
        durationSec: durationMs / 1000
      },
      tempoMap: tempoMap,
      tracks: {
        rhythm: { notes: notes, phrases: [] }
      },
      metadata: {
        defaultTrackId: "rhythm",
        source: "spotify_chart_builder",
        difficulty: difficulty,
        laneCount: laneCount
      }
    });

    return new SparkPlayAlongChart({
      trackId: trackId,
      trackUri: "spotify:track:" + trackId,
      difficulty: difficulty,
      instrument: analysis.instrument || "guitar",
      audio: { bpm: bpm, key: analysis.key, mode: analysis.mode, timeSignature: analysis.timeSignature },
      songChart: songChart,
      chords: chords,
      sections: [],
      techniques: [],
      targets: {},
      curriculum: {}
    });
  };

  function seededRandom(seed) {
    var s = seed | 0;
    return function() {
      s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashCode(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  window.SparkChartBuilder = ChartBuilder;
})();
