(function() {
  'use strict';

  class SparkMicInput {
    constructor() {
      this.stream = null;
      this.source = null;
      this.analyser = null;
      this.context = null;
    }

    async start() {
      this.context = window.SparkAudioEngine
        ? window.SparkAudioEngine.getSharedContext()
        : new (window.AudioContext || window.webkitAudioContext)();

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.source = this.context.createMediaStreamSource(this.stream);
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 2048;
      this.source.connect(this.analyser);
    }

    getSamples() {
      if (!this.analyser) return null;
      var buffer = new Float32Array(this.analyser.fftSize);
      this.analyser.getFloatTimeDomainData(buffer);
      return buffer;
    }

    getFrequencyData() {
      if (!this.analyser) return null;
      var buffer = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(buffer);
      return buffer;
    }

    getSampleRate() {
      return this.context ? this.context.sampleRate : null;
    }

    getAnalyser() {
      return this.analyser;
    }

    stop() {
      if (this.source) {
        this.source.disconnect();
        this.source = null;
      }
      if (this.stream) {
        this.stream.getTracks().forEach(function(t) { t.stop(); });
        this.stream = null;
      }
      this.analyser = null;
    }
  }

  window.SparkMicInput = SparkMicInput;
})();
