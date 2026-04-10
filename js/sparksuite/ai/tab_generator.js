(function() {
  'use strict';

  var NUM_STRINGS = 6;
  var MAX_FRET_JUMP = 5;

  /**
   * SparkTabGenerator -- turns a note sequence into guitar tab data
   * and can render it as ASCII tablature.
   * @param {SparkFretboardMapper} fretboardMapper
   */
  function TabGenerator(fretboardMapper) {
    if (!fretboardMapper) {
      throw new Error('SparkTabGenerator requires a SparkFretboardMapper instance');
    }
    this._mapper = fretboardMapper;
  }

  /**
   * Generate tab data from a note sequence.
   * Optimises for playability: prefers same string for consecutive
   * notes and avoids fret jumps greater than MAX_FRET_JUMP.
   *
   * @param {Array<{time: number, note: string, octave: number, midi: number}>} sequence
   * @returns {Array<{time: number, string: number, fret: number, note: string}>}
   */
  TabGenerator.prototype.generate = function(sequence) {
    if (!sequence || !sequence.length) return [];

    this._mapper.reset();
    var result = [];
    var lastString = -1;
    var lastFret = 0;

    for (var i = 0; i < sequence.length; i++) {
      var entry = sequence[i];
      var pos = this._mapper.map(entry.note, entry.octave);

      if (!pos) continue;

      // If the fret jump is too large and another position on the
      // same (or nearby) string would be closer, try to find it.
      if (Math.abs(pos.fret - lastFret) > MAX_FRET_JUMP) {
        var alt = this._findCloserPosition(entry, lastString, lastFret);
        if (alt) pos = alt;
      }

      result.push({
        time: entry.time,
        string: pos.string,
        fret: pos.fret,
        note: entry.note
      });

      lastString = pos.string;
      lastFret = pos.fret;
    }

    return result;
  };

  /**
   * Try to find an alternative fret position that keeps the hand
   * closer to lastFret, preferring lastString when possible.
   * @private
   */
  TabGenerator.prototype._findCloserPosition = function(entry, lastString, lastFret) {
    var midi = entry.midi;
    var tuning = this._mapper._tuning;
    var best = null;
    var bestScore = Infinity;

    for (var i = 0; i < tuning.length; i++) {
      var fret = midi - tuning[i].midi;
      if (fret < 0 || fret > 24) continue;

      var fretDist = Math.abs(fret - lastFret);
      // Prefer same string (small bonus) and minimal fret distance
      var stringPenalty = (tuning[i].string === lastString) ? 0 : 1;
      var score = fretDist + stringPenalty;

      if (score < bestScore) {
        bestScore = score;
        best = { string: tuning[i].string, fret: fret };
      }
    }

    return best;
  };

  /**
   * Render tab data as an ASCII tablature string.
   * @param {Array<{time: number, string: number, fret: number, note: string}>} tabData
   * @param {number} [bpm=120] - beats per minute, used to space notes
   * @returns {string}
   */
  TabGenerator.prototype.toAsciiTab = function(tabData, bpm) {
    if (!tabData || !tabData.length) return '';

    bpm = bpm || 120;
    var msPerBeat = 60000 / bpm;
    var STRING_LABELS = ['e|', 'B|', 'G|', 'D|', 'A|', 'E|'];

    // Initialise six string lines
    var lines = [];
    for (var s = 0; s < NUM_STRINGS; s++) {
      lines.push(STRING_LABELS[s]);
    }

    // Sort by time
    var sorted = tabData.slice().sort(function(a, b) { return a.time - b.time; });

    var prevTime = sorted[0].time;

    for (var i = 0; i < sorted.length; i++) {
      var entry = sorted[i];

      // Add dashes for elapsed time
      var gap = entry.time - prevTime;
      var dashes = Math.max(1, Math.round(gap / (msPerBeat / 4)));
      if (i === 0) dashes = 0;

      // Pad all strings with dashes
      for (var s = 0; s < NUM_STRINGS; s++) {
        for (var d = 0; d < dashes; d++) {
          lines[s] += '-';
        }
      }

      // Place fret number on the correct string (string 1 = line 0)
      var lineIndex = entry.string - 1;
      var fretStr = String(entry.fret);

      for (var s = 0; s < NUM_STRINGS; s++) {
        if (s === (NUM_STRINGS - 1 - lineIndex)) {
          lines[s] += fretStr;
        } else {
          // Pad other strings with dashes to keep alignment
          for (var p = 0; p < fretStr.length; p++) {
            lines[s] += '-';
          }
        }
      }

      prevTime = entry.time;
    }

    // Add trailing dashes and bar line
    for (var s = 0; s < NUM_STRINGS; s++) {
      lines[s] += '-|';
    }

    return lines.join('\n');
  };

  window.SparkTabGenerator = TabGenerator;
})();
