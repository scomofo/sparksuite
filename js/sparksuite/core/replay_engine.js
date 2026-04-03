(function() {
  function ReplayEngine() {
    this.inputs = [];
  }

  ReplayEngine.prototype.record = function(event) {
    this.inputs.push({
      atSec: event.atSec,
      laneMask: event.laneMask,
      kind: event.kind
    });
  };

  ReplayEngine.prototype.export = function() {
    return {
      inputs: this.inputs.slice()
    };
  };

  window.SparkReplayEngine = ReplayEngine;
})();
