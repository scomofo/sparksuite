(function() {
  var MIN_INTERVAL_MS = 8000;

  function VoiceCoach(voiceQueue) {
    this.queue = voiceQueue || new SparkVoiceQueue();
    this._lastCoachTime = 0;
    this._sectionBoundary = false;
  }

  VoiceCoach.prototype.evaluate = function(performance, currentTimeMs) {
    var now = currentTimeMs || Date.now();
    if (now - this._lastCoachTime < MIN_INTERVAL_MS) return;
    if (!this._sectionBoundary) return;

    var messages = this._generateMessages(performance);
    if (messages.length) {
      this.queue.enqueue(messages[0]);
      this._lastCoachTime = now;
    }
  };

  VoiceCoach.prototype.markSectionBoundary = function() {
    this._sectionBoundary = true;
  };

  VoiceCoach.prototype.clearSectionBoundary = function() {
    this._sectionBoundary = false;
  };

  VoiceCoach.prototype.forceMessage = function(text) {
    this.queue.enqueue(text);
  };

  VoiceCoach.prototype._generateMessages = function(perf) {
    perf = perf || {};
    var msgs = [];
    if (perf.timing > 100) msgs.push("Slow down a bit, you're rushing");
    else if (perf.timing < -100) msgs.push("Try to push forward slightly");
    if (perf.accuracy < 0.5) msgs.push("Focus on getting the right notes first");
    else if (perf.accuracy < 0.7) msgs.push("Good, now clean up those chord shapes");
    if (perf.consistency < 0.5) msgs.push("Try this section slower until it's steady");
    if (perf.accuracy > 0.9 && Math.abs(perf.timing || 0) < 40) msgs.push("Excellent! That was really clean");
    return msgs;
  };

  window.SparkVoiceCoach = VoiceCoach;
})();
