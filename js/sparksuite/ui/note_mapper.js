(function() {
  /**
   * SparkNoteMapper -- maps chart events to fretboard positions.
   * Bridges between gameplay note lanes and instrument-specific visuals.
   */
  function NoteMapper() {}

  function getPrimaryLaneFromMask(laneMask) {
    if (typeof laneMask !== "number" || laneMask <= 0) return null;
    for (var lane = 0; lane < 32; lane++) {
      if (laneMask & (1 << lane)) return lane;
    }
    return null;
  }

  /**
   * Map a timeline event to fretboard coordinates.
   * @param {Object} event - { type, lane, chord, notes }
   * @returns {Object} { type, positions }
   */
  NoteMapper.prototype.mapToFretboard = function(event) {
    if (!event) return { type: "none", positions: [] };

    if (event.type === "chord" && event.chord) {
      var shape = (typeof SparkChordShapes !== "undefined") ? SparkChordShapes[event.chord] : null;
      return {
        type: "chord",
        chord: event.chord,
        positions: shape ? shape.map(function(fret, string) {
          return { string: string, fret: fret };
        }) : []
      };
    }

    // Single note: prefer explicit lane, then derive from laneMask.
    // Open or unmapped notes should stay null instead of collapsing to string 0.
    var stringIndex = typeof event.lane === "number" ? event.lane : getPrimaryLaneFromMask(event.laneMask);
    return {
      type: "note",
      positions: [{ string: stringIndex, fret: 0 }]
    };
  };

  /**
   * Map an array of visible events for the current frame.
   */
  NoteMapper.prototype.mapFrame = function(events) {
    var self = this;
    return events.map(function(e) { return self.mapToFretboard(e); });
  };

  window.SparkNoteMapper = NoteMapper;
})();
