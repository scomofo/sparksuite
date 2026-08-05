// js/sparksuite/services/events.js
(function() {

  var _queue = [];
  var _listeners = {};

  var SparkEvents = {
    emit: function(type, payload) {
      var evt = {
        type: type,
        payload: payload || {},
        timestamp: Date.now()
      };
      _queue.push(evt);
      var fns = _listeners[type];
      if (fns) {
        for (var i = 0; i < fns.length; i++) {
          try { fns[i](evt); } catch (e) { console.error("SparkEvents listener error:", e); }
        }
      }
    },

    getPending: function() {
      return _queue.slice();
    },

    clear: function() {
      _queue = [];
    },

    on: function(type, fn) {
      if (!_listeners[type]) _listeners[type] = [];
      _listeners[type].push(fn);
    },

    off: function(type, fn) {
      if (!fn) { delete _listeners[type]; return; }
      var fns = _listeners[type];
      if (!fns) return;
      _listeners[type] = fns.filter(function(f) { return f !== fn; });
    }
  };

  window.SparkEvents = SparkEvents;
})();
