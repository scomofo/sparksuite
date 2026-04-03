(function() {
  window.SparkGuitarRhythmCurriculum = {
    selectChartId: function(context) {
      context = context || {};
      if (context && context.segment && context.segment.meta && context.segment.meta.accuracy < 75) {
        return "power_chords_01";
      }
      return "power_chords_01";
    }
  };
})();
