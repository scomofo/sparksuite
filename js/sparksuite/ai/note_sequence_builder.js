(function() {
  'use strict';

  /**
   * SparkNoteSequenceBuilder -- converts a raw pitch stream into a
   * de-duplicated sequence of discrete notes suitable for tab generation.
   */
  function NoteSequenceBuilder() {
    this._dedupeWindowMs = 50;
  }

  /**
   * Build a note sequence from a pitch stream.
   * @param {Array<{time: number, frequency: number}>} pitchStream
   * @returns {Array<{time: number, note: string, octave: number, midi: number}>}
   */
  NoteSequenceBuilder.prototype.build = function(pitchStream) {
    if (!pitchStream || !pitchStream.length) return [];

    var mapper = window.SparkInputNoteMapper;
    if (!mapper) {
      throw new Error('SparkNoteSequenceBuilder requires SparkInputNoteMapper to be loaded');
    }

    var result = [];
    var lastMidi = null;
    var lastTime = -Infinity;

    for (var i = 0; i < pitchStream.length; i++) {
      var sample = pitchStream[i];
      var noteData = mapper.frequencyToNote(sample.frequency);

      if (!noteData) continue;

      // Filter duplicates within the dedupe window
      var timeDelta = sample.time - lastTime;
      if (noteData.midi === lastMidi && timeDelta < this._dedupeWindowMs) {
        continue;
      }

      result.push({
        time: sample.time,
        note: noteData.note,
        octave: noteData.octave,
        midi: noteData.midi
      });

      lastMidi = noteData.midi;
      lastTime = sample.time;
    }

    return result;
  };

  /**
   * Set the deduplication window in milliseconds.
   * @param {number} ms
   */
  NoteSequenceBuilder.prototype.setDedupeWindow = function(ms) {
    this._dedupeWindowMs = ms;
  };

  window.SparkNoteSequenceBuilder = NoteSequenceBuilder;
})();
