(function() {
  /**
   * SparkNoteMapper -- maps chart events to fretboard positions.
   * Bridges between gameplay note lanes and instrument-specific visuals.
   */
  function NoteMapper() {}

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

    // Single note: map lane to string
    return {
      type: "note",
      positions: [{ string: event.lane || 0, fret: 0 }]
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
