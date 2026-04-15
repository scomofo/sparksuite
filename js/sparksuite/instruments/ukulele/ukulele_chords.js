(function() {
  var COLORS = {
    1: "#FF6B6B",
    2: "#4ECDC4",
    3: "#45B7D1",
    4: "#FFE66D"
  };

  var CHORD_DEFS = {
    C: {
      frets: [0, 0, 0, 3],
      fingers: [{ stringIndex: 3, fret: 3, finger: 3, color: COLORS[3] }]
    },
    Am: {
      frets: [2, 0, 0, 0],
      fingers: [{ stringIndex: 0, fret: 2, finger: 2, color: COLORS[2] }]
    },
    F: {
      frets: [2, 0, 1, 0],
      fingers: [
        { stringIndex: 2, fret: 1, finger: 1, color: COLORS[1] },
        { stringIndex: 0, fret: 2, finger: 2, color: COLORS[2] }
      ]
    },
    G: {
      frets: [0, 2, 3, 2],
      fingers: [
        { stringIndex: 1, fret: 2, finger: 1, color: COLORS[1] },
        { stringIndex: 3, fret: 2, finger: 2, color: COLORS[2] },
        { stringIndex: 2, fret: 3, finger: 3, color: COLORS[3] }
      ]
    },
    G7: {
      frets: [0, 2, 1, 2],
      fingers: [
        { stringIndex: 2, fret: 1, finger: 1, color: COLORS[1] },
        { stringIndex: 1, fret: 2, finger: 2, color: COLORS[2] },
        { stringIndex: 3, fret: 2, finger: 3, color: COLORS[3] }
      ]
    },
    Dm: {
      frets: [2, 2, 1, 0],
      fingers: [
        { stringIndex: 2, fret: 1, finger: 1, color: COLORS[1] },
        { stringIndex: 0, fret: 2, finger: 2, color: COLORS[2] },
        { stringIndex: 1, fret: 2, finger: 3, color: COLORS[3] }
      ]
    },
    Em: {
      frets: [0, 4, 3, 2],
      fingers: [
        { stringIndex: 3, fret: 2, finger: 1, color: COLORS[1] },
        { stringIndex: 2, fret: 3, finger: 2, color: COLORS[2] },
        { stringIndex: 1, fret: 4, finger: 3, color: COLORS[3] }
      ]
    },
    A: {
      frets: [2, 1, 0, 0],
      fingers: [
        { stringIndex: 1, fret: 1, finger: 1, color: COLORS[1] },
        { stringIndex: 0, fret: 2, finger: 2, color: COLORS[2] }
      ]
    },
    D: {
      frets: [2, 2, 2, 0],
      barre: { fret: 2, fromString: 0, toString: 2 }
    },
    E7: {
      frets: [1, 2, 0, 2],
      fingers: [
        { stringIndex: 0, fret: 1, finger: 1, color: COLORS[1] },
        { stringIndex: 1, fret: 2, finger: 2, color: COLORS[2] },
        { stringIndex: 3, fret: 2, finger: 3, color: COLORS[3] }
      ]
    },
    Bb: {
      frets: [1, 1, 2, 3],
      barre: { fret: 1, fromString: 0, toString: 1 },
      fingers: [
        { stringIndex: 2, fret: 2, finger: 2, color: COLORS[2] },
        { stringIndex: 3, fret: 3, finger: 3, color: COLORS[3] }
      ]
    },
    C7: {
      frets: [0, 0, 0, 1],
      fingers: [{ stringIndex: 3, fret: 1, finger: 1, color: COLORS[1] }]
    },
    Bm: {
      frets: [4, 2, 2, 2],
      barre: { fret: 2, fromString: 1, toString: 3 },
      fingers: [{ stringIndex: 0, fret: 4, finger: 3, color: COLORS[3] }]
    },
    Em7: {
      frets: [0, 2, 0, 2],
      fingers: [
        { stringIndex: 1, fret: 2, finger: 1, color: COLORS[1] },
        { stringIndex: 3, fret: 2, finger: 2, color: COLORS[2] }
      ]
    },
    Am7: {
      frets: [0, 0, 0, 0],
      fingers: []
    },
    Cmaj7: {
      frets: [0, 0, 0, 2],
      fingers: [{ stringIndex: 3, fret: 2, finger: 2, color: COLORS[2] }]
    }
  };

  var NOTES = {
    C: ["C", "E", "G"],
    Am: ["A", "C", "E"],
    F: ["F", "A", "C"],
    G: ["G", "B", "D"],
    G7: ["G", "B", "D", "F"],
    Dm: ["D", "F", "A"],
    Em: ["E", "G", "B"],
    A: ["A", "C#", "E"],
    D: ["D", "F#", "A"],
    E7: ["E", "G#", "B", "D"],
    Bb: ["Bb", "D", "F"],
    C7: ["C", "E", "G", "Bb"],
    Bm: ["B", "D", "F#"],
    Em7: ["E", "G", "B", "D"],
    Am7: ["A", "C", "E", "G"],
    Cmaj7: ["C", "E", "G", "B"]
  };

  var LEVEL_MAP = {
    1: ["C", "Am"],
    2: ["F", "G", "D", "E7"],
    3: ["G7", "Dm", "Bb", "C7"],
    4: ["Em", "A", "Bm", "Em7", "Am7", "Cmaj7"]
  };

  function shapeToArray(definition) {
    return (definition && definition.frets ? definition.frets : [0, 0, 0, 0]).slice();
  }

  function buildChord(name) {
    var definition = CHORD_DEFS[name] || { frets: [0, 0, 0, 0], fingers: [] };
    var shape = shapeToArray(definition);
    return {
      name: name,
      short: name,
      frets: shape,
      open: shape.map(function(fret) { return fret === 0; }),
      muted: [],
      fingers: (definition.fingers || []).slice(),
      barre: definition.barre || null,
      stringCount: 4,
      stringNames: ["G", "C", "E", "A"]
    };
  }

  var levelChords = {};
  var allChords = [];
  for (var level in LEVEL_MAP) {
    if (!Object.prototype.hasOwnProperty.call(LEVEL_MAP, level)) continue;
    levelChords[level] = [];
    for (var i = 0; i < LEVEL_MAP[level].length; i++) {
      var chord = buildChord(LEVEL_MAP[level][i]);
      levelChords[level].push(chord);
      allChords.push(chord);
    }
  }

  var shapeMap = {};
  for (var chordName in CHORD_DEFS) {
    if (!Object.prototype.hasOwnProperty.call(CHORD_DEFS, chordName)) continue;
    shapeMap[chordName] = shapeToArray(CHORD_DEFS[chordName]);
  }

  window.SparkUkuleleChords = shapeMap;
  window.SparkUkuleleChordNotes = NOTES;
  window.SparkUkuleleLevelChords = levelChords;
  window.SparkUkuleleAllChords = allChords;

  if (typeof normalizeUkuleleChord === "function" && typeof validateChordChart === "function") {
    for (var chordIndex = 0; chordIndex < allChords.length; chordIndex++) {
      var normalized = normalizeUkuleleChord(allChords[chordIndex]);
      var errors = validateChordChart(normalized);
      if (errors.length > 0) {
        console.warn("[UkuleleChords] Validation errors for " + allChords[chordIndex].name + ":", errors);
      }
    }
  }
})();
