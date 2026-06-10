(function(root) {
  "use strict";

  var NOTE_TO_PC = {
    C: 0,
    "C#": 1,
    Db: 1,
    D: 2,
    "D#": 3,
    Eb: 3,
    E: 4,
    F: 5,
    "F#": 6,
    Gb: 6,
    G: 7,
    "G#": 8,
    Ab: 8,
    A: 9,
    "A#": 10,
    Bb: 10,
    B: 11
  };

  var PC_TO_NAME = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

  function normalizeCapoFret(value) {
    var fret = typeof value === "number" ? value : Number(value);
    if (!isFinite(fret)) return 0;
    fret = Math.round(fret);
    if (fret < 0) return 0;
    if (fret > 12) return 12;
    return fret;
  }

  function parseChordName(chordName) {
    var text = typeof chordName === "string" ? chordName.trim() : "";
    var parts;
    var match;
    if (!text) return null;
    parts = text.split("/");
    match = parts[0].match(/^([A-G](?:#|b)?)(.*)$/);
    if (!match) return null;
    return {
      root: match[1],
      suffix: match[2] || "",
      bass: parts.length > 1 ? parts.slice(1).join("/") : "",
      original: text
    };
  }

  function transposeRoot(rootName, semitones) {
    var pc = NOTE_TO_PC[rootName];
    if (typeof pc !== "number") return rootName;
    return PC_TO_NAME[(pc + semitones + 120) % 12];
  }

  function transposeChordName(chordName, semitones) {
    var parsed = parseChordName(chordName);
    var transposed;
    var bass;
    if (!parsed) return chordName;
    transposed = transposeRoot(parsed.root, semitones) + parsed.suffix;
    if (parsed.bass) {
      bass = parseChordName(parsed.bass);
      transposed += "/" + (bass ? transposeRoot(bass.root, semitones) + bass.suffix : parsed.bass);
    }
    return transposed;
  }

  function getDisplayChord(chordName, capoFret) {
    var fret = normalizeCapoFret(capoFret);
    var original = typeof chordName === "string" ? chordName.trim() : "";
    var display = fret ? transposeChordName(original, -fret) : original;
    var changed = display !== original;
    return {
      original: original,
      sounding: original,
      display: display,
      capoFret: fret,
      label: changed ? display + " (sounds " + original + ")" : original
    };
  }

  function mapProgression(progression, capoFret) {
    var items = Array.isArray(progression) ? progression : [];
    var mapped = [];
    for (var i = 0; i < items.length; i++) {
      mapped.push(getDisplayChord(items[i], capoFret));
    }
    return mapped;
  }

  var api = {
    normalizeCapoFret: normalizeCapoFret,
    parseChordName: parseChordName,
    transposeRoot: transposeRoot,
    transposeChordName: transposeChordName,
    getDisplayChord: getDisplayChord,
    mapProgression: mapProgression
  };

  root.SparkCapoMode = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
