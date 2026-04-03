(function() {
  function NoteEvent(input) {
    input = input || {};
    this.id = input.id || ("note_" + Math.random().toString(36).slice(2, 10));
    this.tick = input.tick || 0;
    this.tickLength = input.tickLength || 0;
    this.laneMask = input.laneMask || 0;
    this.flags = input.flags || {};
    this.difficulty = input.difficulty || "easy";
    this.instrument = input.instrument || "guitar";
    this.label = input.label || "";
    this.skillId = input.skillId || null;
  }

  window.SparkNoteEvent = NoteEvent;
})();
