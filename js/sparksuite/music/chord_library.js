(function() {
  /**
   * SparkChordLibrary — chord progressions by key for chart generation.
   * Maps Spotify key indices (0-11) to common progressions.
   */

  // Spotify key index: 0=C, 1=C#, 2=D, ... 11=B
  var KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  var PROGRESSIONS = {
    C:  { major: ["C", "Am", "F", "G"],       minor: ["Cm", "Eb", "Ab", "Bb"] },
    D:  { major: ["D", "Bm", "G", "A"],       minor: ["Dm", "F", "Bb", "C"] },
    E:  { major: ["E", "C#m", "A", "B"],      minor: ["Em", "G", "C", "D"] },
    F:  { major: ["F", "Dm", "Bb", "C"],      minor: ["Fm", "Ab", "Db", "Eb"] },
    G:  { major: ["G", "Em", "C", "D"],       minor: ["Gm", "Bb", "Eb", "F"] },
    A:  { major: ["A", "F#m", "D", "E"],      minor: ["Am", "C", "F", "G"] },
    B:  { major: ["B", "G#m", "E", "F#"],     minor: ["Bm", "D", "G", "A"] }
  };

  // Fallback for sharp keys → nearest natural key
  var SHARP_FALLBACK = {
    "C#": "D", "D#": "E", "F#": "G", "G#": "A", "A#": "B"
  };

  var SparkChordLibrary = {
    KEY_NAMES: KEY_NAMES,

    getProgression: function(keyIndex, mode, difficulty) {
      var keyName = KEY_NAMES[keyIndex] || "C";
      var lookup = keyName;
      if (SHARP_FALLBACK[keyName]) lookup = SHARP_FALLBACK[keyName];
      var entry = PROGRESSIONS[lookup] || PROGRESSIONS.C;
      var modeKey = mode === 0 ? "minor" : "major";
      var chords = entry[modeKey] || entry.major;

      if (difficulty === "easy") return chords.slice(0, 2);
      if (difficulty === "hard") return chords.concat([chords[0]]);
      return chords.slice();
    }
  };

  window.SparkChordLibrary = SparkChordLibrary;
})();
