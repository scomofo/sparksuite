(function() {
  // Markov-style transition probabilities: chord → likely next chords (ordered by probability)
  var TRANSITIONS = {
    "C":  ["G","Am","F","Dm"],
    "D":  ["G","A","Bm","Em"],
    "E":  ["A","B","C#m","F#m"],
    "F":  ["C","G","Dm","Am"],
    "G":  ["C","D","Em","Am"],
    "A":  ["D","E","F#m","Bm"],
    "B":  ["E","F#","G#m","C#m"],
    "Am": ["F","G","C","Dm","Em"],
    "Dm": ["G","Am","C","F"],
    "Em": ["Am","G","C","D"],
    "Bm": ["A","G","D","Em"],
    "Cm": ["Fm","G","Ab","Bb"],
    "Fm": ["Cm","Bb","Ab","Eb"]
  };

  function ChordPredictor() {
    this._history = [];
  }

  /**
   * Predict next chord from a known progression.
   */
  ChordPredictor.prototype.predict = function(currentIndex, progression) {
    if (!progression || currentIndex + 1 >= progression.length) return null;
    return progression[currentIndex + 1];
  };

  /**
   * Get upcoming chords within a time window from the chart.
   */
  ChordPredictor.prototype.predictWindow = function(currentTimeMs, chords, windowMs) {
    windowMs = windowMs || 2000;
    if (!chords || !chords.length) return [];
    var result = [];
    for (var i = 0; i < chords.length; i++) {
      var t = chords[i].time;
      if (t > currentTimeMs && t < currentTimeMs + windowMs) {
        result.push(chords[i]);
      }
    }
    return result;
  };

  /**
   * Predict using Markov transitions when the progression is unknown.
   */
  ChordPredictor.prototype.predictFromContext = function(currentChord) {
    var candidates = TRANSITIONS[currentChord];
    if (!candidates || !candidates.length) return null;

    // If we have history, weight toward patterns we've seen
    if (this._history.length >= 2) {
      var prev = this._history[this._history.length - 2];
      for (var i = 0; i < candidates.length; i++) {
        // Check if we've seen this exact transition before
        for (var h = 0; h < this._history.length - 1; h++) {
          if (this._history[h] === currentChord && this._history[h + 1] === candidates[i]) {
            return candidates[i];
          }
        }
      }
    }

    return candidates[0];
  };

  /**
   * Record a chord for learning transitions.
   */
  ChordPredictor.prototype.record = function(chord) {
    this._history.push(chord);
    if (this._history.length > 64) this._history.shift();
  };

  ChordPredictor.prototype.reset = function() {
    this._history = [];
  };

  window.SparkChordPredictor = ChordPredictor;
})();
