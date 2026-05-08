(function() {
  function noop() {}

  function SparkRhythmHighwayPageAdapter(options) {
    options = options || {};
    this.controllerFactory = options.controllerFactory || function(controllerOptions) {
      return typeof SparkRhythmHighwayRuntimeController !== "undefined"
        ? new SparkRhythmHighwayRuntimeController(controllerOptions || {})
        : null;
    };
    this.activeController = null;
  }

  SparkRhythmHighwayPageAdapter.prototype.createController = function(options) {
    options = options || {};
    this.destroy();
    this.activeController = this.controllerFactory({
      bridgeOptions: options.bridgeOptions || {},
      onRender: typeof options.onRender === "function" ? options.onRender : noop,
      onFinalize: typeof options.onFinalize === "function" ? options.onFinalize : noop
    });
    return this.activeController;
  };

  SparkRhythmHighwayPageAdapter.prototype.start = function(payload, options) {
    options = options || {};
    var controller = this.activeController || this.createController(options);
    if (!controller) return null;
    var state = controller.load(payload || {}, options.runtime || {});
    if (options.autoPlay !== false) controller.play(options.play || {});
    return state;
  };

  SparkRhythmHighwayPageAdapter.prototype.stop = function() {
    if (!this.activeController) return null;
    return this.activeController.stop();
  };

  SparkRhythmHighwayPageAdapter.prototype.getState = function() {
    return this.activeController && typeof this.activeController.getState === "function"
      ? this.activeController.getState()
      : null;
  };

  SparkRhythmHighwayPageAdapter.prototype.destroy = function() {
    if (this.activeController && typeof this.activeController.destroy === "function") {
      this.activeController.destroy();
    }
    this.activeController = null;
  };

  if (typeof window !== "undefined") window.SparkRhythmHighwayPageAdapter = SparkRhythmHighwayPageAdapter;
  if (typeof module !== "undefined") module.exports = SparkRhythmHighwayPageAdapter;
})();
