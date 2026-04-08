(function(){
  if (!window.SparkInstrumentDiscoveryManifest) return;

  var manifest = window.SparkInstrumentDiscoveryManifest;

  function inject(src) {
    document.write('<script src="' + src + '"><\/script>');
  }

  for (var i = 0; i < manifest.length; i++) {
    var entry = manifest[i];
    if (!entry || entry.enabled === false) continue;

    // Load SparkSuite module files first
    if (Array.isArray(entry.sparkSuiteFiles)) {
      for (var j = 0; j < entry.sparkSuiteFiles.length; j++) {
        inject(entry.sparkSuiteFiles[j]);
      }
    }

    // Then runtime files (register last ideally)
    if (Array.isArray(entry.runtimeFiles)) {
      for (var k = 0; k < entry.runtimeFiles.length; k++) {
        inject(entry.runtimeFiles[k]);
      }
    }
  }
})();
