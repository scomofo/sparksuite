(function() {
  function SparkEventBus(options) {
    options = options || {};
    this.maxEvents = typeof options.maxEvents === "number" ? options.maxEvents : 1000;
    this.events = [];
    this.listeners = {};
    this._id = 0;
  }

  SparkEventBus.prototype.makeId = function() {
    this._id += 1;
    return "spark_event_" + this._id;
  };

  SparkEventBus.prototype.emit = function(type, payload) {
    var event = {
      id: this.makeId(),
      type: type,
      payload: payload || {},
      createdAt: new Date().toISOString(),
      monotonicAt: typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now()
    };
    var exact = this.listeners[type] || [];
    var all = this.listeners["*"] || [];
    var i;

    this.events.push(event);
    if (this.events.length > this.maxEvents) this.events.shift();

    for (i = 0; i < exact.length; i++) exact[i](event);
    for (i = 0; i < all.length; i++) all[i](event);
    return event;
  };

  SparkEventBus.prototype.on = function(type, listener) {
    if (typeof listener !== "function") return function() {};
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(listener);
    return this.off.bind(this, type, listener);
  };

  SparkEventBus.prototype.off = function(type, listener) {
    var arr = this.listeners[type] || [];
    this.listeners[type] = arr.filter(function(entry) {
      return entry !== listener;
    });
  };

  SparkEventBus.prototype.getRecent = function(limit) {
    limit = typeof limit === "number" ? limit : this.events.length;
    return this.events.slice(Math.max(0, this.events.length - limit));
  };

  SparkEventBus.prototype.clear = function() {
    this.events.length = 0;
    this.listeners = {};
  };

  if (typeof window !== "undefined") {
    window.SparkEventBus = SparkEventBus;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      SparkEventBus: SparkEventBus
    };
  }
})();
