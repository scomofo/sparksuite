(function() {
  function SongChart(input) {
    input = input || {};
    this.song = input.song || {};
    this.tempoMap = input.tempoMap || null;
    this.tracks = input.tracks || {};
    this.metadata = input.metadata || {};
  }

  window.SparkSongChart = SongChart;
})();
