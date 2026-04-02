// js/performance-core/spark-highway-adapter.js
// Adapter seam for the shared SparkHighway renderer.
// Currently delegates to the existing SparkHighway class in spark-highway.js.
// When a shared renderer is extracted to Dev/shared/spark-highway.js,
// only this file needs to change.
(function() {

  var PerfHighwayAdapter = {
    create: function(canvasEl, skinConfig) {
      if (typeof SparkHighway === "undefined") {
        console.error("PerfHighwayAdapter: SparkHighway not loaded");
        return null;
      }
      var renderer = new SparkHighway(canvasEl, skinConfig || SparkHighway.GUITAR_SKIN);
      renderer._initPromise = renderer.init();
      return renderer;
    },

    // TODO(pianospark): When PianoSpark adopts performance-core, pass
    // SparkHighway.PIANO_SKIN instead of GUITAR_SKIN. The adapter should
    // accept an instrument parameter to select the correct skin.

    setChart: function(renderer, events, phrases) {
      if (renderer && renderer.setChart) renderer.setChart(events, phrases);
    },

    update: function(renderer, currentTimeSec, combo) {
      if (renderer && renderer._ready && renderer.update) renderer.update(currentTimeSec, combo);
    },

    notifyHit: function(renderer, x, y, color) {
      if (renderer && renderer.notifyHit) renderer.notifyHit(x, y, color);
    },

    destroy: function(renderer) {
      if (renderer && renderer.destroy) renderer.destroy();
    }
  };

  window.PerfHighwayAdapter = PerfHighwayAdapter;
})();
