(function() {
  var SparkChartDifficulty = {
    EASY: "easy",
    NORMAL: "normal",
    HARD: "hard"
  };

  /**
   * SparkPlayAlongChart — wraps a SparkSongChart with Spotify track metadata.
   * The underlying songChart uses standard SparkSongChart/SparkTempoMap/SparkNoteEvent
   * so it plugs directly into RhythmGameplayEngine and ExecutionGateway.
   */
  function PlayAlongChart(input) {
    input = input || {};
    this.version = "1.0";
    this.trackId = input.trackId || null;
    this.trackUri = input.trackUri || null;
    this.difficulty = input.difficulty || SparkChartDifficulty.EASY;
    this.instrument = input.instrument || "guitar";
    this.songChart = input.songChart || null;
    this.chords = input.chords || [];
    this.sections = input.sections || [];
    this.techniques = input.techniques || [];
    this.targets = input.targets || {};
    this.curriculum = input.curriculum || {};
    this.audio = input.audio || {};
  }

  PlayAlongChart.prototype.getBpm = function() {
    if (this.audio && this.audio.bpm) return this.audio.bpm;
    if (!this.songChart || !this.songChart.tempoMap) return 100;
    var segs = this.songChart.tempoMap.segments;
    return segs && segs.length ? segs[0].bpm : 100;
  };

  PlayAlongChart.prototype.getNotes = function() {
    if (!this.songChart || !this.songChart.tracks) return [];
    for (var key in this.songChart.tracks) {
      if (this.songChart.tracks[key] && this.songChart.tracks[key].notes) {
        return this.songChart.tracks[key].notes;
      }
    }
    return [];
  };

  /**
   * Returns timeline events: {time, type, lane, duration, velocity}
   */
  PlayAlongChart.prototype.getTimeline = function() {
    var notes = this.getNotes();
    var bpm = this.getBpm();
    var ppq = (this.songChart && this.songChart.tempoMap) ? this.songChart.tempoMap.ppq : 480;
    var timeline = [];
    for (var i = 0; i < notes.length; i++) {
      var n = notes[i];
      var timeMs = (n.tick / ppq) * (60000 / bpm);
      var durMs = (n.tickLength / ppq) * (60000 / bpm);
      timeline.push({
        time: Math.round(timeMs),
        type: "note",
        lane: n.lane != null ? n.lane : 0,
        duration: Math.round(durMs),
        velocity: 1
      });
    }
    return timeline;
  };

  PlayAlongChart.prototype.toJSON = function() {
    return {
      version: this.version,
      trackId: this.trackId,
      trackUri: this.trackUri,
      difficulty: this.difficulty,
      instrument: this.instrument,
      audio: this.audio,
      songChart: this.songChart,
      chords: this.chords,
      sections: this.sections,
      techniques: this.techniques,
      targets: this.targets,
      curriculum: this.curriculum
    };
  };

  window.SparkChartDifficulty = SparkChartDifficulty;
  window.SparkPlayAlongChart = PlayAlongChart;
})();
