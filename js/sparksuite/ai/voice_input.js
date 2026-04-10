(function() {
  /**
   * SparkVoiceInput -- captures voice commands via Web Speech API.
   * Hands-free control so the user never leaves their instrument.
   */
  function VoiceInput() {
    this._recognition = null;
    this._listening = false;
  }

  VoiceInput.prototype.isSupported = function() {
    return typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
  };

  /**
   * Start listening for voice commands.
   * @param {Function} onCommand - called with transcript string
   */
  VoiceInput.prototype.start = function(onCommand) {
    if (!this.isSupported()) return false;
    if (this._listening) return true;

    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this._recognition = new SpeechRecognition();
    this._recognition.continuous = true;
    this._recognition.interimResults = false;
    this._recognition.lang = "en-US";

    this._recognition.onresult = function(event) {
      var last = event.results[event.results.length - 1];
      if (last && last[0]) {
        var text = last[0].transcript.trim();
        if (text && typeof onCommand === "function") onCommand(text);
      }
    };

    this._recognition.onerror = function() { /* non-fatal */ };
    this._recognition.start();
    this._listening = true;
    return true;
  };

  VoiceInput.prototype.stop = function() {
    if (this._recognition) {
      this._recognition.stop();
      this._recognition = null;
    }
    this._listening = false;
  };

  VoiceInput.prototype.isListening = function() {
    return this._listening;
  };

  window.SparkVoiceInput = VoiceInput;
})();
