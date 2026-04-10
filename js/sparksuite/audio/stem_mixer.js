(function() {
  function StemMixer(audioContext) {
    this.ctx = audioContext || SparkAudioEngine.getSharedContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this._tracks = {}; this._startTime = 0; this._offset = 0; this._playing = false;
    this._speed = 1.0;
  }

  StemMixer.prototype.loadStems = function(stems) {
    this.stop(); this._tracks = {};
    for (var name in stems) {
      if (!stems[name]) continue;
      var g = this.ctx.createGain(); g.connect(this.masterGain);
      this._tracks[name] = { buffer: stems[name], gain: g, source: null };
    }
  };

  StemMixer.prototype.play = function(offsetSec) {
    this.stop(); offsetSec = offsetSec || 0;
    var startAt = this.ctx.currentTime + 0.01;
    for (var name in this._tracks) {
      var t = this._tracks[name];
      var src = this.ctx.createBufferSource();
      src.buffer = t.buffer; src.playbackRate.value = this._speed; src.connect(t.gain); src.start(startAt, offsetSec); t.source = src;
    }
    this._startTime = startAt; this._offset = offsetSec; this._playing = true;
  };

  StemMixer.prototype.stop = function() {
    for (var n in this._tracks) { var t = this._tracks[n];
      if (t.source) { try { t.source.stop(); } catch(e) {} t.source.disconnect(); t.source = null; } }
    this._playing = false;
  };

  StemMixer.prototype.getTimeSec = function() {
    if (!this._playing) return this._offset;
    return (this.ctx.currentTime - this._startTime) * this._speed + this._offset;
  };
  StemMixer.prototype.getTimeMs = function() { return this.getTimeSec() * 1000; };
  StemMixer.prototype.mute = function(n) { if (this._tracks[n]) this._tracks[n].gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02); };
  StemMixer.prototype.unmute = function(n) { if (this._tracks[n]) this._tracks[n].gain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.02); };
  StemMixer.prototype.setVolume = function(n, v) { if (this._tracks[n]) this._tracks[n].gain.gain.setTargetAtTime(Math.max(0,Math.min(1,v)), this.ctx.currentTime, 0.02); };
  StemMixer.prototype.setMasterVolume = function(v) { this.masterGain.gain.setTargetAtTime(Math.max(0,Math.min(1,v)), this.ctx.currentTime, 0.02); };
  StemMixer.prototype.getStemNames = function() { return Object.keys(this._tracks); };
  StemMixer.prototype.isPlaying = function() { return this._playing; };
  StemMixer.prototype.seek = function(t) { var was = this._playing; this.stop(); if (was) this.play(t); else this._offset = t; };
  StemMixer.prototype.pause = function() { if (!this._playing) return; this._offset = this.getTimeSec(); this.stop(); };
  StemMixer.prototype.setPlaybackRate = function(rate) {
    rate = Math.max(0.25, Math.min(4, rate || 1));
    var currentSec = this.getTimeSec();
    this._speed = rate;
    if (this._playing) this.play(currentSec);
    else this._offset = currentSec;
  };

  window.SparkStemMixer = StemMixer;
})();
