(function() {
  var MODES = { FULL_MIX: "full_mix", PRACTICE: "practice", SOLO_GUITAR: "solo_guitar", MINUS_ONE: "minus_one" };

  function StemController(stemMixer) { this.mixer = stemMixer; this._mode = MODES.FULL_MIX; this._mutedStem = null; }

  StemController.prototype.enablePracticeMode = function() { this._mode = MODES.PRACTICE; this._setAll(1); this.mixer.mute("guitar"); };
  StemController.prototype.disablePracticeMode = function() { this._mode = MODES.FULL_MIX; this._setAll(1); };

  StemController.prototype.soloGuitar = function() {
    this._mode = MODES.SOLO_GUITAR;
    var names = this.mixer.getStemNames();
    for (var i = 0; i < names.length; i++) { if (names[i] === "guitar") this.mixer.unmute(names[i]); else this.mixer.mute(names[i]); }
  };

  StemController.prototype.muteOne = function(stem) { this._mode = MODES.MINUS_ONE; this._mutedStem = stem; this._setAll(1); this.mixer.mute(stem); };

  StemController.prototype.fadeOut = function(stem, dur) {
    dur = dur || 2; var steps = 20, iv = (dur * 1000) / steps, vol = 1, self = this;
    var timer = setInterval(function() { vol -= 1/steps; if (vol <= 0) { vol = 0; clearInterval(timer); } self.mixer.setVolume(stem, vol); }, iv);
  };
  StemController.prototype.fadeIn = function(stem, dur) {
    dur = dur || 2; var steps = 20, iv = (dur * 1000) / steps, vol = 0, self = this;
    var timer = setInterval(function() { vol += 1/steps; if (vol >= 1) { vol = 1; clearInterval(timer); } self.mixer.setVolume(stem, vol); }, iv);
  };

  StemController.prototype.getMode = function() { return this._mode; };
  StemController.prototype.getMutedStem = function() { return this._mutedStem; };
  StemController.prototype._setAll = function(v) { var n = this.mixer.getStemNames(); for (var i = 0; i < n.length; i++) { if (v === 1) this.mixer.unmute(n[i]); else this.mixer.setVolume(n[i], v); } };

  StemController.MODES = MODES;
  window.SparkStemController = StemController;
})();
