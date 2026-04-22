(function() {
  'use strict';

  var NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Standard guitar tuning: open string MIDI numbers
  // String 1 (high E) = E4 = 64, String 6 (low E) = E2 = 40
  var STANDARD_TUNING = [
    { string: 6, note: 'E', octave: 2, midi: 40 },
    { string: 5, note: 'A', octave: 2, midi: 45 },
    { string: 4, note: 'D', octave: 3, midi: 50 },
    { string: 3, note: 'G', octave: 3, midi: 55 },
    { string: 2, note: 'B', octave: 3, midi: 59 },
    { string: 1, note: 'E', octave: 4, midi: 64 }
  ];

  var MAX_FRET = 24;

  /**
   * SparkFretboardMapper -- maps note names and octaves to guitar
   * string/fret positions, minimising hand movement between notes.
   */
  function FretboardMapper() {
    this._tuning = STANDARD_TUNING;
    this._lastFret = 0;
  }

  /**
   * Convert a note name and octave to a MIDI number.
   * @param {string} noteName  e.g. 'C#'
   * @param {number} octave    e.g. 4
   * @returns {number} MIDI note number
   */
  FretboardMapper.prototype.noteToMidi = function(noteName, octave) {
    var index = NOTE_NAMES.indexOf(noteName);
    if (index === -1) return -1;
    return (octave + 1) * 12 + index;
  };

  /**
   * Map a note to the best string/fret position.
   * Prefers the position closest to the last played fret.
   * @param {string} noteName
   * @param {number} octave
   * @returns {{string: number, fret: number}|null}
   */
  FretboardMapper.prototype.map = function(noteName, octave) {
    var targetMidi = this.noteToMidi(noteName, octave);
    if (targetMidi < 0) return null;

    var bestPos = null;
    var bestDistance = Infinity;

    for (var i = 0; i < this._tuning.length; i++) {
      var openMidi = this._tuning[i].midi;
      var fret = targetMidi - openMidi;

      if (fret < 0 || fret > MAX_FRET) continue;

      var distance = Math.abs(fret - this._lastFret);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestPos = { string: this._tuning[i].string, fret: fret };
      }
    }

    if (bestPos) {
      this._lastFret = bestPos.fret;
    }

    return bestPos;
  };

  /**
   * Reset the hand-position tracker.
   */
  FretboardMapper.prototype.reset = function() {
    this._lastFret = 0;
  };

  /**
   * Override the tuning (array of {string, note, octave, midi}).
   * @param {Array} tuning
   */
  FretboardMapper.prototype.setTuning = function(tuning) {
    this._tuning = tuning;
    this._lastFret = 0;
  };

  window.SparkFretboardMapper = FretboardMapper;
})();
