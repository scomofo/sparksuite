// Sustained-match tracker for mic verification. A momentary spike over the
// threshold is not evidence of a clean chord — the score must stay at or
// above `threshold` for `holdMs` continuous milliseconds. Pure logic so the
// guided-session verify flow can be unit tested without audio.
(function(){
  function createVerificationTracker(options){
    options = options || {};
    var threshold = typeof options.threshold === "number" ? options.threshold : 80;
    var holdMs = typeof options.holdMs === "number" ? options.holdMs : 1500;
    var holdStart = null;
    var verified = false;
    return {
      update: function(match, nowMs){
        if (verified) return true;
        nowMs = typeof nowMs === "number" ? nowMs : Date.now();
        if (typeof match !== "number" || match < threshold) {
          holdStart = null;
          return false;
        }
        if (holdStart === null) holdStart = nowMs;
        if (nowMs - holdStart >= holdMs) verified = true;
        return verified;
      },
      isVerified: function(){ return verified; },
      progress: function(nowMs){
        if (verified) return 1;
        if (holdStart === null) return 0;
        nowMs = typeof nowMs === "number" ? nowMs : Date.now();
        return Math.max(0, Math.min(1, (nowMs - holdStart) / holdMs));
      },
      reset: function(){
        holdStart = null;
        verified = false;
      }
    };
  }

  window.createVerificationTracker = createVerificationTracker;
})();
