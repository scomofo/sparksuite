(function() {
  function SourceSeparator() {
    this.stemLoader = typeof SparkStemLoader !== "undefined" ? new SparkStemLoader() : null;
  }

  SourceSeparator.prototype.separate = function(trackId, ctx, options) {
    options = options || {};
    if (!this.stemLoader) return Promise.reject(new Error("StemLoader not available"));
    var self = this;
    return this.stemLoader.hasStemsOnDisk(trackId).then(function(exists) {
      if (exists) return self.stemLoader.loadFromDisk(trackId, ctx);
      if (options.audioPath && options.outputDir) {
        return self.stemLoader.separateWithDemucs(options.audioPath, options.outputDir, ctx);
      }
      return null;
    });
  };

  SourceSeparator.prototype.separateFromFiles = function(files, ctx) {
    if (!this.stemLoader) return Promise.reject(new Error("StemLoader not available"));
    return this.stemLoader.loadFromFiles(files, ctx);
  };

  SourceSeparator.prototype.isAvailable = function(trackId) {
    if (!this.stemLoader) return Promise.resolve(false);
    return this.stemLoader.hasStemsOnDisk(trackId);
  };

  window.SparkSourceSeparator = SourceSeparator;
})();
