(function() {
  window.SparkGuitarRhythmCurriculum = {
    selectChartId: function(context) {
      if (window.SparkGuitarModule && typeof window.SparkGuitarModule.selectChartId === "function") {
        return window.SparkGuitarModule.selectChartId(context);
      }
      context = context || {};
      if (context && context.segment && context.segment.meta && context.segment.meta.accuracy < 75) {
        return "power_chords_01";
      }
      return "power_chords_01";
    }
  };
})();
