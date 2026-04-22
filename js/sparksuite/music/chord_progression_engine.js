(function() {
  /**
   * SparkChordProgressionEngine — builds chord timelines from track analysis.
   * Works with SparkChordLibrary to produce musically coherent progressions.
   */
  function ChordProgressionEngine() {}

  /**
   * Build a chord timeline for a track.
   * @param {Object} analysis - from TrackAnalyzer { bpm, key, mode, durationMs }
   * @param {string} difficulty - "easy" | "normal" | "hard"
   * @returns {Array} [{time, chord, duration}]
   */
  ChordProgressionEngine.prototype.buildChordTimeline = function(analysis, difficulty) {
    var bpm = analysis.bpm || 120;
    var key = analysis.key != null ? analysis.key : 0;
    var mode = analysis.mode != null ? analysis.mode : 1;
    var durationMs = analysis.durationMs || 180000;
    var beatMs = 60000 / bpm;
    var barMs = beatMs * 4; // assume 4/4

    var progression = SparkChordLibrary.getProgression(key, mode, difficulty);
    if (!progression || !progression.length) return [];

    var timeline = [];
    var time = 0;
    var idx = 0;

    while (time < durationMs) {
      timeline.push({
        time: Math.round(time),
        chord: progression[idx % progression.length],
        duration: Math.round(barMs)
      });
      time += barMs;
      idx++;
    }

    return timeline;
  };

  window.SparkChordProgressionEngine = ChordProgressionEngine;
})();
