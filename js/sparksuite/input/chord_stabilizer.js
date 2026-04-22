(function() {
  "use strict";

  // Prevents chord detection flickering by buffering recent detections
  // and returning the most frequent chord in the buffer.
  function SparkChordStabilizer() {
    this._buffer = [];
    this._bufferSize = 5;
    this._lastStable = null;
  }

  // Push chord to buffer, trim to bufferSize, return stable chord
  SparkChordStabilizer.prototype.update = function(chord) {
    this._buffer.push(chord);
    if (this._buffer.length > this._bufferSize) {
      this._buffer = this._buffer.slice(this._buffer.length - this._bufferSize);
    }
    this._lastStable = this.getStableChord();
    return this._lastStable;
  };

  // Count occurrences in buffer, return the most frequent chord.
  // If there is a tie, return _lastStable.
  SparkChordStabilizer.prototype.getStableChord = function() {
    if (this._buffer.length === 0) return this._lastStable;

    var counts = {};
    var maxCount = 0;
    var maxChord = null;
    var tied = false;

    for (var i = 0; i < this._buffer.length; i++) {
      var c = this._buffer[i];
      var key = (c === null || c === undefined) ? "__null__" : c;
      counts[key] = (counts[key] || 0) + 1;
      if (counts[key] > maxCount) {
        maxCount = counts[key];
        maxChord = c;
        tied = false;
      } else if (counts[key] === maxCount && c !== maxChord) {
        tied = true;
      }
    }

    if (tied) return this._lastStable;
    return maxChord;
  };

  // Adjust buffer size
  SparkChordStabilizer.prototype.setBufferSize = function(n) {
    this._bufferSize = n;
    if (this._buffer.length > this._bufferSize) {
      this._buffer = this._buffer.slice(this._buffer.length - this._bufferSize);
    }
  };

  // Clear buffer and lastStable
  SparkChordStabilizer.prototype.reset = function() {
    this._buffer = [];
    this._lastStable = null;
  };

  // Return count of dominant chord / buffer length (0 to 1)
  SparkChordStabilizer.prototype.getConfidence = function() {
    if (this._buffer.length === 0) return 0;

    var counts = {};
    var maxCount = 0;

    for (var i = 0; i < this._buffer.length; i++) {
      var c = this._buffer[i];
      var key = (c === null || c === undefined) ? "__null__" : c;
      counts[key] = (counts[key] || 0) + 1;
      if (counts[key] > maxCount) {
        maxCount = counts[key];
      }
    }

    return maxCount / this._buffer.length;
  };

  window.SparkChordStabilizer = SparkChordStabilizer;
})();
