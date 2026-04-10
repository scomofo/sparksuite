(function() {
  function TTSEngine() {
    this._rate = 1.0;
    this._volume = 0.8;
  }

  TTSEngine.prototype.isSupported = function() {
    return typeof speechSynthesis !== "undefined";
  };

  TTSEngine.prototype.speak = function(text) {
    if (!this.isSupported()) return Promise.resolve();
    return new Promise(function(resolve) {
      var utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this._rate || 1.0;
      utterance.volume = this._volume || 0.8;
      utterance.onend = resolve;
      utterance.onerror = resolve;
      speechSynthesis.speak(utterance);
    }.bind(this));
  };

  TTSEngine.prototype.setRate = function(rate) { this._rate = rate; };
  TTSEngine.prototype.setVolume = function(vol) { this._volume = vol; };
  TTSEngine.prototype.cancel = function() { if (this.isSupported()) speechSynthesis.cancel(); };

  window.SparkTTSEngine = TTSEngine;
})();
