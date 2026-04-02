// js/performance-core/performance-events.js
(function() {

  var PerfEvents = {
    emit: function(type, payload) {
      if (typeof SparkEvents !== "undefined" && SparkEvents.emit) {
        SparkEvents.emit(type, payload);
      }
    }
  };

  window.PerfEvents = PerfEvents;
})();
