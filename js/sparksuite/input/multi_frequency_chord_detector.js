(function() {
  'use strict';

  function uniqueNotes(notes) {
    var unique = [];
    for (var i = 0; i < notes.length; i++) {
      if (notes[i] && unique.indexOf(notes[i]) === -1) {
        unique.push(notes[i]);
      }
    }
    return unique;
  }

  class SparkMultiFrequencyChordDetector {
    constructor(options) {
      options = options || {};
      this.chordDetector = options.chordDetector || null;
      this.stabilizer = options.stabilizer || null;
      this.minAmplitude = options.minAmplitude != null ? options.minAmplitude : 50;
      this.minFrequency = options.minFrequency != null ? options.minFrequency : 60;
      this.maxFrequency = options.maxFrequency != null ? options.maxFrequency : 1200;
      this.maxPeaks = options.maxPeaks != null ? options.maxPeaks : 5;
      this.minConfidence = options.minConfidence != null ? options.minConfidence : 0.6;
      this.minSamplesForConfidence = options.minSamplesForConfidence != null ? options.minSamplesForConfidence : 3;

      if (this.stabilizer && typeof this.stabilizer.setBufferSize === 'function') {
        this.stabilizer.setBufferSize(10);
      }
    }

    getTopFrequencies(freqData, sampleRate, fftSize, count) {
      if (!freqData || !freqData.length || !sampleRate || !fftSize) return [];
      if (count == null) count = this.maxPeaks;

      var peaks = [];
      for (var i = 1; i < freqData.length - 1; i++) {
        var amp = freqData[i];
        if (amp < this.minAmplitude) continue;
        if (amp < freqData[i - 1] || amp < freqData[i + 1]) continue;

        var freq = (i * sampleRate) / fftSize;
        if (freq < this.minFrequency || freq > this.maxFrequency) continue;
        peaks.push({ freq: freq, amp: amp });
      }

      peaks.sort(function(a, b) { return b.amp - a.amp; });

      var freqs = [];
      for (var p = 0; p < peaks.length && freqs.length < count; p++) {
        freqs.push(peaks[p].freq);
      }
      return freqs;
    }

    processDetection(rawChord) {
      var smoothed = rawChord;
      var confidence = rawChord ? 1 : 0;

      if (this.stabilizer) {
        smoothed = this.stabilizer.update(rawChord);
        confidence = this.stabilizer.getConfidence();
        var sampleCount = Array.isArray(this.stabilizer._buffer) ? this.stabilizer._buffer.length : 0;
        if (sampleCount > 0 && this.minSamplesForConfidence > 1) {
          confidence = confidence * Math.min(1, sampleCount / this.minSamplesForConfidence);
        }
      }

      return {
        rawChord: rawChord,
        smoothedChord: smoothed,
        confidence: confidence,
        chord: confidence >= this.minConfidence ? smoothed : null
      };
    }

    detect(analyser, sampleRate, pitchDetector, timeDomainData) {
      if (!analyser || !sampleRate) return null;

      var freqData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqData);

      var freqs = this.getTopFrequencies(freqData, sampleRate, analyser.fftSize, this.maxPeaks);
      var notes = [];
      var i;
      for (i = 0; i < freqs.length; i++) {
        var mapped = window.SparkInputNoteMapper
          ? window.SparkInputNoteMapper.frequencyToNoteName(freqs[i])
          : null;
        if (mapped) notes.push(mapped);
      }

      var pitchFrequency = null;
      var pitchNote = null;
      if (pitchDetector && typeof pitchDetector.detect === 'function' && timeDomainData && timeDomainData.length) {
        pitchFrequency = pitchDetector.detect(timeDomainData, sampleRate);
        if (pitchFrequency && typeof pitchDetector.frequencyToNote === 'function') {
          pitchNote = pitchDetector.frequencyToNote(pitchFrequency);
          if (pitchNote) notes.unshift(pitchNote);
        }
      }

      notes = uniqueNotes(notes);

      var rawChord = this.chordDetector && typeof this.chordDetector.detect === 'function'
        ? this.chordDetector.detect(notes)
        : null;
      var processed = this.processDetection(rawChord);

      return {
        frequencies: freqs,
        notes: notes,
        pitchFrequency: pitchFrequency,
        pitchNote: pitchNote,
        rawChord: rawChord,
        smoothedChord: processed.smoothedChord,
        confidence: processed.confidence,
        chord: processed.chord
      };
    }

    reset() {
      if (this.stabilizer && typeof this.stabilizer.reset === 'function') {
        this.stabilizer.reset();
      }
    }
  }

  window.SparkMultiFrequencyChordDetector = SparkMultiFrequencyChordDetector;
})();
