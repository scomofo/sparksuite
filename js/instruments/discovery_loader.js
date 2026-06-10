// js/instruments/discovery_loader.js
// Optional manifest-backed instrument loader for tooling and experiments.
// Production boot still uses explicit data-deferred-src tags for deterministic order.
(function() {
  function manifest() {
    return window.SPARK_INSTRUMENT_MANIFEST || [];
  }

  function existingScriptSources() {
    var seen = {};
    var nodes = document.querySelectorAll("script[src],script[data-deferred-src]");
    for (var i = 0; i < nodes.length; i++) {
      var src = nodes[i].getAttribute("src") || nodes[i].getAttribute("data-deferred-src");
      if (src) seen[src] = true;
    }
    return seen;
  }

  function manifestScripts() {
    var seen = existingScriptSources();
    var sources = [];
    manifest().forEach(function(entry) {
      (entry.scripts || []).forEach(function(src) {
        if (seen[src]) return;
        seen[src] = true;
        sources.push(src);
      });
    });
    return sources;
  }

  function loadSequentially(sources, index, done) {
    if (index >= sources.length) {
      if (typeof done === "function") done();
      return;
    }

    var src = sources[index];
    var script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.setAttribute("data-spark-discovered", "true");
    script.onload = function() {
      loadSequentially(sources, index + 1, done);
    };
    script.onerror = function(err) {
      console.warn("SparkInstrumentDiscovery failed to load", src, err);
      loadSequentially(sources, index + 1, done);
    };
    (document.body || document.head || document.documentElement).appendChild(script);
  }

  function loadAll(callback) {
    loadSequentially(manifestScripts(), 0, callback);
  }

  window.SparkInstrumentDiscovery = {
    getScripts: manifestScripts,
    loadAll: loadAll
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() { loadAll(); });
  } else {
    loadAll();
  }
})();
