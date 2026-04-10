(function() {
  /**
   * SparkDifficultyScaler — post-processes charts to adjust density.
   */
  function DifficultyScaler() {}

  /**
   * Apply difficulty scaling to a PlayAlongChart.
   * Modifies the underlying songChart notes in place.
   */
  DifficultyScaler.prototype.apply = function(playAlongChart, difficulty) {
    if (!playAlongChart || !playAlongChart.songChart) return playAlongChart;
    var tracks = playAlongChart.songChart.tracks;
    if (!tracks) return playAlongChart;

    for (var trackId in tracks) {
      if (!tracks[trackId] || !tracks[trackId].notes) continue;
      var notes = tracks[trackId].notes;

      if (difficulty === "easy") {
        // Remove every other note for easier play
        tracks[trackId].notes = notes.filter(function(_, i) { return i % 2 === 0; });
      } else if (difficulty === "hard") {
        // Add sustain flags to some notes for variety
        for (var i = 0; i < notes.length; i++) {
          if (i % 4 === 0 && notes[i].tickLength === 0) {
            notes[i].tickLength = 240; // half-beat sustain
            notes[i].flags = notes[i].flags || {};
            notes[i].flags.sustain = true;
          }
        }
      }
      // "normal" passes through unchanged
    }

    return playAlongChart;
  };

  window.SparkDifficultyScaler = DifficultyScaler;
})();
