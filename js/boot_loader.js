(function() {
  var _loading = false;
  var _loaded = false;
  var _scheduled = false;
  var _callbacks = [];
  var _failed = [];

  function deferredNodes() {
    return Array.prototype.slice.call(document.querySelectorAll("script[data-deferred-src]"));
  }

  function pendingNodes() {
    return Array.prototype.slice.call(document.querySelectorAll("script[data-deferred-src]:not([data-deferred-loaded]):not([data-deferred-failed])"));
  }

  function hasDeferredScripts() {
    return !_loaded && _failed.length === 0 && pendingNodes().length > 0;
  }

  function flushCallbacks() {
    while (_callbacks.length) {
      try { (_callbacks.shift())(); }
      catch (err) { console.error("SparkBootLoader callback failed", err); }
    }
  }

  function finishLoad() {
    _loading = false;
    if (_failed.length) {
      document.documentElement.setAttribute("data-spark-deferred-ready", "false");
      document.documentElement.setAttribute("data-spark-deferred-failed", "true");
      _callbacks = [];
      if (typeof render === "function") render({ sync: true });
      return;
    }
    _loaded = true;
    document.documentElement.setAttribute("data-spark-deferred-ready", "true");
    document.documentElement.removeAttribute("data-spark-deferred-failed");
    flushCallbacks();
    if (typeof render === "function") render({ sync: true });
  }

  function loadSequentially(nodes, index) {
    if (index >= nodes.length) {
      finishLoad();
      return;
    }

    var placeholder = nodes[index];
    var src = placeholder.getAttribute("data-deferred-src");
    if (!src) {
      loadSequentially(nodes, index + 1);
      return;
    }

    var script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = function() {
      placeholder.setAttribute("data-deferred-loaded", "true");
      loadSequentially(nodes, index + 1);
    };
    script.onerror = function(err) {
      _failed.push(src);
      placeholder.setAttribute("data-deferred-failed", "true");
      console.error("SparkBootLoader failed to load", src, err);
      loadSequentially(nodes, index + 1);
    };
    document.body.appendChild(script);
  }

  function loadDeferredScripts(callback) {
    if (_loaded || !hasDeferredScripts()) {
      _loaded = true;
      if (typeof callback === "function") callback();
      return;
    }
    if (typeof callback === "function") _callbacks.push(callback);
    if (_loading) return;
    _loading = true;
    loadSequentially(deferredNodes(), 0);
  }

  function afterDeferredScripts(callback) {
    if (typeof callback !== "function") return;
    if (_loaded || !hasDeferredScripts()) {
      callback();
      return;
    }
    _callbacks.push(callback);
  }

  function scheduleDeferredScripts() {
    if (_scheduled || _loading || _loaded || !hasDeferredScripts()) return;
    _scheduled = true;
    var kick = function() {
      loadDeferredScripts();
    };
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(kick, { timeout: 1200 });
      return;
    }
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(function() {
        window.requestAnimationFrame(function() {
          setTimeout(kick, 0);
        });
      });
      return;
    }
    setTimeout(kick, 0);
  }

  window.SparkBootLoader = {
    afterDeferredScripts: afterDeferredScripts,
    getFailures: function() { return _failed.slice(); },
    hasDeferredScripts: hasDeferredScripts,
    hasFailures: function() { return _failed.length > 0; },
    isDeferredReady: function() { return _loaded || !hasDeferredScripts(); },
    loadDeferredScripts: loadDeferredScripts,
    scheduleDeferredScripts: scheduleDeferredScripts
  };
})();
