(function() {
  function noop() {}

  function SparkRhythmHighwayRuntimeController(options) {
    options = options || {};
    this.bridge = options.bridge || (typeof SparkRhythmRuntimeBridge !== "undefined" ? new SparkRhythmRuntimeBridge(options.bridgeOptions || {}) : null);
    this.renderCallback = typeof options.onRender === "function" ? options.onRender : noop;
    this.finalizeCallback = typeof options.onFinalize === "function" ? options.onFinalize : noop;
    this.raf = null;
    this.running = false;
  }

  SparkRhythmHighwayRuntimeController.prototype.load = function(payload, options) {
    if (!this.bridge) return null;
    return this.bridge.load(payload || {}, options || {});
  };

  SparkRhythmHighwayRuntimeController.prototype.play = function(options) {
    if (!this.bridge) return null;
    this.running = true;
    var state = this.bridge.play(options || {});
    this.requestFrame();
    return state;
  };

  SparkRhythmHighwayRuntimeController.prototype.pause = function() {
    this.running = false;
    if (this.raf && typeof cancelAnimationFrame === "function") cancelAnimationFrame(this.raf);
    this.raf = null;
    return this.bridge && typeof this.bridge.pause === "function" ? this.bridge.pause() : null;
  };

  SparkRhythmHighwayRuntimeController.prototype.stop = function() {
    this.running = false;
    if (this.raf && typeof cancelAnimationFrame === "function") cancelAnimationFrame(this.raf);
    this.raf = null;
    return this.bridge && typeof this.bridge.stop === "function" ? this.bridge.stop() : null;
  };

  SparkRhythmHighwayRuntimeController.prototype.seek = function(positionSec) {
    return this.bridge && typeof this.bridge.seek === "function" ? this.bridge.seek(positionSec) : null;
  };

  SparkRhythmHighwayRuntimeController.prototype.tick = function(nowMs) {
    if (!this.bridge) return null;
    var state = this.bridge.tick();
    this.renderCallback(state);
    if (state && state.transport && state.transport.status === "completed") {
      this.running = false;
      this.finalizeCallback(state);
      return state;
    }
    if (this.running) this.requestFrame();
    return state;
  };

  SparkRhythmHighwayRuntimeController.prototype.requestFrame = function() {
    var self = this;
    if (this.raf || typeof requestAnimationFrame !== "function") return;
    this.raf = requestAnimationFrame(function(nowMs) {
      self.raf = null;
      self.tick(nowMs);
    });
  };

  SparkRhythmHighwayRuntimeController.prototype.getState = function() {
    return this.bridge && typeof this.bridge.getState === "function" ? this.bridge.getState() : null;
  };

  SparkRhythmHighwayRuntimeController.prototype.destroy = function() {
    this.running = false;
    if (this.raf && typeof cancelAnimationFrame === "function") cancelAnimationFrame(this.raf);
    this.raf = null;
    if (this.bridge && typeof this.bridge.destroy === "function") this.bridge.destroy();
  };

  if (typeof window !== "undefined") window.SparkRhythmHighwayRuntimeController = SparkRhythmHighwayRuntimeController;
  if (typeof module !== "undefined") module.exports = SparkRhythmHighwayRuntimeController;
})();
