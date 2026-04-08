(function() {
  window.SparkUkuleleScales = {
    c_major: {
      id: "c_major",
      name: "C Major",
      notes: ["C", "D", "E", "F", "G", "A", "B"],
      positions: [
        { string: 1, fret: 0, note: "C" },
        { string: 1, fret: 2, note: "D" },
        { string: 2, fret: 0, note: "E" },
        { string: 2, fret: 1, note: "F" },
        { string: 2, fret: 3, note: "G" },
        { string: 3, fret: 0, note: "A" },
        { string: 3, fret: 2, note: "B" },
        { string: 3, fret: 3, note: "C" }
      ]
    },
    a_minor: {
      id: "a_minor",
      name: "A Minor",
      notes: ["A", "B", "C", "D", "E", "F", "G"],
      positions: [
        { string: 3, fret: 0, note: "A" },
        { string: 3, fret: 2, note: "B" },
        { string: 3, fret: 3, note: "C" },
        { string: 4, fret: 0, note: "D" },
        { string: 4, fret: 2, note: "E" },
        { string: 4, fret: 3, note: "F" },
        { string: 1, fret: 0, note: "G" },
        { string: 1, fret: 2, note: "A" }
      ]
    }
  };
})();
