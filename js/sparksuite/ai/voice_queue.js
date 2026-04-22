(function() {
  var MAX_QUEUE = 3;
  var COOLDOWN_MS = 5000;

  function VoiceQueue(ttsEngine) {
    this.tts = ttsEngine || new SparkTTSEngine();
    this._queue = [];
    this._speaking = false;
    this._lastSpoke = 0;
  }

  VoiceQueue.prototype.enqueue = function(message) {
    if (!message) return;
    if (this._queue.length >= MAX_QUEUE) return;
    var now = Date.now();
    if (now - this._lastSpoke < COOLDOWN_MS && this._speaking) return;
    this._queue.push(message);
    this._process();
  };

  VoiceQueue.prototype._process = function() {
    if (this._speaking || !this._queue.length) return;
    this._speaking = true;
    var msg = this._queue.shift();
    var self = this;
    this._lastSpoke = Date.now();
    this.tts.speak(msg).then(function() {
      self._speaking = false;
      self._process();
    });
  };

  VoiceQueue.prototype.clear = function() { this._queue = []; this.tts.cancel(); this._speaking = false; };
  VoiceQueue.prototype.isSpeaking = function() { return this._speaking; };

  window.SparkVoiceQueue = VoiceQueue;
})();
