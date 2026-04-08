// js/instruments/discovery_loader.js
// Reads SPARK_INSTRUMENT_MANIFEST and injects script tags at runtime.
// Must be loaded after instrument_manifest.generated.js
(function() {
  var manifest = window.SPARK_INSTRUMENT_MANIFEST || [];
  if (!manifest.length) return;

  manifest.forEach(function(entry) {
    entry.scripts.forEach(function(src) {
      var script = document.createElement("script");
      script.src = src;
      script.async = false; // preserve load order
      document.head.appendChild(script);
    });
  });
})();
