(function() {
  // Standard guitar tuning: open string MIDI numbers
  var TUNING = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4
  var MAX_FRET = 22;
  var NOTES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

  function FingeringOptimizer() {
    this._lastPos = null;
  }

  FingeringOptimizer.prototype.optimize = function(sequence) {
    this._lastPos = null;
    var result = [];
    for (var i = 0; i < sequence.length; i++) {
      var positions = this._getPositions(sequence[i]);
      if (!positions.length) { result.push(null); continue; }
      var best = positions[0];
      var bestCost = Infinity;
      for (var j = 0; j < positions.length; j++) {
        var cost = this._movementCost(this._lastPos, positions[j]);
        if (cost < bestCost) { bestCost = cost; best = positions[j]; }
      }
      this._lastPos = best;
      result.push({ time: sequence[i].time, string: best.string, fret: best.fret, note: sequence[i].note });
    }
    return result;
  };

  FingeringOptimizer.prototype._getPositions = function(noteObj) {
    var midi = this._noteToMidi(noteObj.note, noteObj.octave);
    if (midi == null) return [];
    var positions = [];
    for (var s = 0; s < TUNING.length; s++) {
      var fret = midi - TUNING[s];
      if (fret >= 0 && fret <= MAX_FRET) {
        positions.push({ string: s, fret: fret });
      }
    }
    return positions;
  };

  FingeringOptimizer.prototype._movementCost = function(prev, pos) {
    if (!prev) return pos.fret; // prefer lower frets when no context
    var fretDist = Math.abs(prev.fret - pos.fret);
    var stringDist = Math.abs(prev.string - pos.string);
    // String changes cost more than fret slides
    return fretDist + stringDist * 2;
  };

  FingeringOptimizer.prototype._noteToMidi = function(name, octave) {
    if (!name) return null;
    var idx = NOTES.indexOf(name);
    if (idx < 0) return null;
    octave = octave != null ? octave : 3;
    return (octave + 1) * 12 + idx;
  };

  FingeringOptimizer.prototype.reset = function() {
    this._lastPos = null;
  };

  window.SparkFingeringOptimizer = FingeringOptimizer;
})();
