(function() {
  'use strict';

  var CHORD_TONES = {
    'C':  ['C', 'E', 'G'],
    'D':  ['D', 'F#', 'A'],
    'E':  ['E', 'G#', 'B'],
    'F':  ['F', 'A', 'C'],
    'G':  ['G', 'B', 'D'],
    'A':  ['A', 'C#', 'E'],
    'B':  ['B', 'D#', 'F#'],
    'Am': ['A', 'C', 'E'],
    'Dm': ['D', 'F', 'A'],
    'Em': ['E', 'G', 'B'],
    'Bm': ['B', 'D', 'F#'],
    'Cm': ['C', 'D#', 'G'],
    'Fm': ['F', 'G#', 'C']
  };

  class SparkChordDetector {
    detect(noteNames) {
      if (!noteNames || noteNames.length === 0) return null;

      var unique = [];
      for (var i = 0; i < noteNames.length; i++) {
        if (unique.indexOf(noteNames[i]) === -1) {
          unique.push(noteNames[i]);
        }
      }

      var bestChord = null;
      var bestScore = 0;

      var chordNames = Object.keys(CHORD_TONES);
      for (var c = 0; c < chordNames.length; c++) {
        var name = chordNames[c];
        var tones = CHORD_TONES[name];
        var matched = 0;

        for (var t = 0; t < tones.length; t++) {
          if (unique.indexOf(tones[t]) !== -1) {
            matched++;
          }
        }

        var ratio = matched / tones.length;
        if (ratio >= 0.66 && ratio > bestScore) {
          bestScore = ratio;
          bestChord = name;
        }
      }

      return bestChord;
    }
  }

  window.SparkChordDetector = SparkChordDetector;
})();
