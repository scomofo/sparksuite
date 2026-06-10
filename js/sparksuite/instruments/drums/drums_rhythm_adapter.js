(function() {
  function DrumsRhythmAdapter() {
    this.runtimeAdapter = typeof SparkDrumsRuntimeAdapter === "function" ? new SparkDrumsRuntimeAdapter() : null;
  }

  DrumsRhythmAdapter.prototype.getLaneCount = function() {
    return 4;
  };

  DrumsRhythmAdapter.prototype.getLaneLabels = function() {
    return ["Kick", "Snare", "Hat", "Aux"];
  };

  DrumsRhythmAdapter.prototype.getDefaultInputMode = function() {
    return "keyboard_or_midi";
  };

  DrumsRhythmAdapter.prototype.getTimingWindow = function() {
    return { perfect: 50, good: 90, late: 135 };
  };

  DrumsRhythmAdapter.prototype.applyGroove = function(notes, groove) {
    if (!groove || !notes) return notes;
    var swing = groove.swing || 0;
    var humanize = groove.humanizeMs || 0;
    for (var i = 0; i < notes.length; i++) {
      var n = notes[i];
      if (swing && n.beat % 2 === 1) n.beat += swing * 0.1;
      if (humanize) n.offsetMs = 0;
    }
    return notes;
  };

  DrumsRhythmAdapter.prototype.createPayload = function(ctx) {
    if (!this.runtimeAdapter && typeof SparkDrumsRuntimeAdapter === "function") {
      this.runtimeAdapter = new SparkDrumsRuntimeAdapter();
    }
    return this.runtimeAdapter.createPayload(ctx || {});
  };

  window.SparkDrumsRhythmAdapter = DrumsRhythmAdapter;
})();
