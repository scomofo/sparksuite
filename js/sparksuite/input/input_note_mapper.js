(function() {
  'use strict';

  var NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var A4 = 440;

  var SparkInputNoteMapper = {
    frequencyToNote: function(freq) {
      if (!freq || freq <= 0) return null;

      var semitones = 12 * Math.log2(freq / A4);
      var midi = Math.round(semitones) + 69;
      var cents = Math.round((semitones - Math.round(semitones)) * 100);
      var noteIndex = ((midi % 12) + 12) % 12;
      var octave = Math.floor(midi / 12) - 1;

      return {
        note: NOTE_NAMES[noteIndex],
        octave: octave,
        midi: midi,
        cents: cents
      };
    },

    frequencyToNoteName: function(freq) {
      var result = this.frequencyToNote(freq);
      return result ? result.note : null;
    }
  };

  window.SparkInputNoteMapper = SparkInputNoteMapper;
})();
