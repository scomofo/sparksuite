(function() {
  // One scoring engine, two skins:
  // - "tiered" (default, rhythm highway): arcade feel — tiered base points
  //   (perfect 100 / good 70 / ok 40), a stepped combo multiplier that
  //   jumps every comboStep hits, and a special-phrase bonus.
  // - "quality" (performance mode): musicianship feel — each hit carries a
  //   continuous 0-1 quality (note overlap x timing blend) worth
  //   100 x quality, with a smooth +10%-per-hit combo ramp.
  // Both share the same combo/accuracy state machine underneath.
  function ScoringEngine(preset, options) {
    this.preset = preset || SparkEnginePresetRegistry.get("spark_learning");
    options = options || {};
    this.profile = options.profile === "quality" ? "quality" : "tiered";
    this.eventBus = null;
    this.performanceMonitor = null;
    this.state = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      hits: 0,
      misses: 0,
      noteMisses: 0,
      inputMisses: 0,
      total: 0,
      specialPhraseHits: 0,
      weakReasons: {},
      laneErrors: {},
      skillHits: {}
    };
  }

  ScoringEngine.prototype.setEventBus = function(eventBus) {
    this.eventBus = eventBus || null;
    return this.eventBus;
  };

  ScoringEngine.prototype.setPerformanceMonitor = function(performanceMonitor) {
    this.performanceMonitor = performanceMonitor || null;
    return this.performanceMonitor;
  };

  ScoringEngine.prototype.apply = function(resolution) {
    var self = this;
    if (this.performanceMonitor && typeof this.performanceMonitor.measure === "function") {
      return this.performanceMonitor.measure("gameplay.hit_detection", "hitDetectionMs", function() {
        return self._applyInternal(resolution);
      });
    }
    return this._applyInternal(resolution);
  };

  ScoringEngine.prototype._applyInternal = function(resolution) {
    this.state.total++;
    var judgement = resolution.judgement;
    var note = resolution.note;
    if (!note) {
      this.state.misses++;
      this.state.inputMisses++;
      bump(this.state.weakReasons, resolution.reason || "miss");
      return { scoreDelta: 0, multiplier: this.getMultiplier(), special: false };
    }

    if (judgement === "miss") {
      this.state.combo = 0;
      this.state.misses++;
      this.state.noteMisses++;
      bump(this.state.weakReasons, resolution.reason || "miss");
      bump(this.state.laneErrors, maskLabel(note.laneMask));
      return { scoreDelta: 0, multiplier: this.getMultiplier(), special: false };
    }

    this.state.hits++;
    this.state.combo++;
    if (this.state.combo > this.state.maxCombo) this.state.maxCombo = this.state.combo;
    if (note.skillId) bump(this.state.skillHits, note.skillId);

    var multiplier = this.getMultiplier();
    var scoreDelta;
    var special = false;
    if (this.profile === "quality") {
      // Performance skin: continuous quality (0-1) x 100 under a smooth
      // combo ramp. Falls back to the judgement tier when no quality rides
      // on the resolution.
      var quality = typeof resolution.quality === "number"
        ? Math.max(0, Math.min(1, resolution.quality))
        : (judgement === "perfect" ? 1 : judgement === "good" ? 0.7 : 0.4);
      scoreDelta = Math.round(100 * quality * multiplier);
    } else {
      // Rhythm skin: tiered arcade points plus special-phrase bonus.
      var base = judgement === "perfect" ? 100 : judgement === "good" ? 70 : 40;
      var bonus = note.flags && note.flags.specialPhrase ? 25 : 0;
      scoreDelta = (base * multiplier) + bonus;
      special = !!(note.flags && note.flags.specialPhrase);
      if (special) this.state.specialPhraseHits++;
    }
    this.state.score += scoreDelta;
    var applied = { scoreDelta: scoreDelta, multiplier: multiplier, special: special };
    if (this.eventBus && typeof this.eventBus.emit === "function") {
      this.eventBus.emit("runtime.score.applied", {
        judgement: judgement,
        laneMask: note.laneMask,
        scoreDelta: applied.scoreDelta,
        combo: this.state.combo,
        totalScore: this.state.score
      });
    }
    return applied;
  };

  ScoringEngine.prototype.getMultiplier = function() {
    if (this.profile === "quality") {
      return Math.min(this.preset.maxMultiplier || 4, 1 + this.state.combo * 0.1);
    }
    return Math.min(this.preset.maxMultiplier || 4, 1 + Math.floor(this.state.combo / (this.preset.comboStep || 10)));
  };

  ScoringEngine.prototype.toSummary = function() {
    // Note accuracy counts chart note events only (hits vs judged/expired
    // notes) so it means the same thing here as in performance mode.
    // Input accuracy additionally counts spurious no-target inputs — the
    // old summary semantics, kept for telemetry and adaptive difficulty.
    var noteTotal = this.state.hits + this.state.noteMisses;
    var noteAccuracy = noteTotal > 0 ? this.state.hits / noteTotal : 0;
    var inputAccuracy = this.state.total > 0 ? this.state.hits / this.state.total : 0;
    return {
      gameplay: {
        score: this.state.score,
        maxCombo: this.state.maxCombo,
        accuracy: Number(noteAccuracy.toFixed(2)),
        inputAccuracy: Number(inputAccuracy.toFixed(2)),
        starPowerUses: 0,
        specialPhraseHits: this.state.specialPhraseHits
      },
      learning: {
        weakReasons: this.state.weakReasons,
        laneErrors: this.state.laneErrors,
        skillHits: this.state.skillHits
      }
    };
  };

  function bump(map, key) {
    map[key] = (map[key] || 0) + 1;
  }

  function maskLabel(mask) {
    return "lane_" + mask;
  }

  window.SparkScoringEngine = ScoringEngine;
  if (typeof module !== "undefined") {
    module.exports = {
      SparkScoringEngine: ScoringEngine
    };
  }
})();
