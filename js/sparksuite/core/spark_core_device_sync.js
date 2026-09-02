/*
 * Part of SparkCore, split by lifecycle. SparkCore's public surface is
 * unchanged: every method here is still SparkCore.prototype.<name> and every
 * existing call site keeps working. See spark_core.js for the constructor and
 * spark_core_boot.js for the composition root.
 *
 * Device runtime sync: tuner, stem player, audio input, metronome, chord detect
 */
(function() {
  var SparkCore = window.SparkCoreRuntime;

  SparkCore.prototype.syncTunerRuntimeState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      tunerActive: Object.prototype.hasOwnProperty.call(options, "active") ? !!options.active : this.runtimeState.tunerActive,
      tunerNote: Object.prototype.hasOwnProperty.call(options, "note") ? options.note : this.runtimeState.tunerNote,
      tunerFreq: Object.prototype.hasOwnProperty.call(options, "freq") ? options.freq : this.runtimeState.tunerFreq,
      tunerCents: Object.prototype.hasOwnProperty.call(options, "cents") ? options.cents : this.runtimeState.tunerCents,
      tunerError: Object.prototype.hasOwnProperty.call(options, "error") ? options.error : this.runtimeState.tunerError
    });
  };

  SparkCore.prototype.syncStemPlayerRuntimeState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      stemPlaying: Object.prototype.hasOwnProperty.call(options, "playing") ? !!options.playing : this.runtimeState.stemPlaying,
      stemCurrentTime: Object.prototype.hasOwnProperty.call(options, "currentTime") ? options.currentTime : this.runtimeState.stemCurrentTime,
      stemDuration: Object.prototype.hasOwnProperty.call(options, "duration") ? options.duration : this.runtimeState.stemDuration
    });
  };

  SparkCore.prototype.syncAudioInputRuntimeState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      audioInputDevices: Object.prototype.hasOwnProperty.call(options, "devices")
        ? this.cloneValue(options.devices || [])
        : this.cloneValue(this.runtimeState.audioInputDevices || []),
      audioInputId: Object.prototype.hasOwnProperty.call(options, "inputId") ? options.inputId : this.runtimeState.audioInputId,
      audioTestingId: Object.prototype.hasOwnProperty.call(options, "testingId") ? options.testingId : this.runtimeState.audioTestingId,
      audioTestLevel: Object.prototype.hasOwnProperty.call(options, "testLevel") ? options.testLevel : this.runtimeState.audioTestLevel
    });
  };

  SparkCore.prototype.syncMetronomeRuntimeState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      metronomeActive: Object.prototype.hasOwnProperty.call(options, "active") ? !!options.active : this.runtimeState.metronomeActive,
      metronomeBpm: Object.prototype.hasOwnProperty.call(options, "bpm") ? options.bpm : this.runtimeState.metronomeBpm,
      metronomeBeat: Object.prototype.hasOwnProperty.call(options, "beat") ? options.beat : this.runtimeState.metronomeBeat,
      metronomeBeatsPerBar: Object.prototype.hasOwnProperty.call(options, "beatsPerBar") ? options.beatsPerBar : this.runtimeState.metronomeBeatsPerBar
    });
  };

  SparkCore.prototype.syncChordDetectRuntimeState = function(options) {
    options = options || {};
    return this.updateRuntimeState({
      chordDetectActive: Object.prototype.hasOwnProperty.call(options, "active") ? !!options.active : this.runtimeState.chordDetectActive,
      chordDetectNotes: Object.prototype.hasOwnProperty.call(options, "notes")
        ? this.cloneValue(options.notes || [])
        : this.cloneValue(this.runtimeState.chordDetectNotes || []),
      chordDetectMatch: Object.prototype.hasOwnProperty.call(options, "match") ? options.match : this.runtimeState.chordDetectMatch,
      chordDetectError: Object.prototype.hasOwnProperty.call(options, "error") ? options.error : this.runtimeState.chordDetectError
    });
  };
})();
