(function() {
  function ScoringEngine(preset) {
    this.preset = preset || SparkEnginePresetRegistry.get("spark_learning");
    this.state = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      hits: 0,
      perfectHits: 0,
      goodHits: 0,
      okHits: 0,
      misses: 0,
      total: 0,
      judgedHits: 0,
      totalTimingOffsetMs: 0,
      specialPhraseHits: 0,
      weakReasons: {},
      laneErrors: {},
      skillHits: {}
    };
  }

  ScoringEngine.prototype.apply = function(resolution) {
    this.state.total++;
    var judgement = resolution.judgement;
    var note = resolution.note;
    if (!note) {
      this.state.misses++;
      bump(this.state.weakReasons, resolution.reason || "miss");
      return { scoreDelta: 0, multiplier: this.getMultiplier(), special: false };
    }

    if (judgement === "miss") {
      this.state.combo = 0;
      this.state.misses++;
      bump(this.state.weakReasons, resolution.reason || "miss");
      bump(this.state.laneErrors, maskLabel(note.laneMask));
      return { scoreDelta: 0, multiplier: this.getMultiplier(), special: false };
    }

    this.state.hits++;
    if (judgement === "perfect") this.state.perfectHits++;
    else if (judgement === "good") this.state.goodHits++;
    else this.state.okHits++;
    this.state.judgedHits++;
    this.state.totalTimingOffsetMs += Math.abs(resolution.diffMs || 0);
    this.state.combo++;
    if (this.state.combo > this.state.maxCombo) this.state.maxCombo = this.state.combo;
    if (note.skillId) bump(this.state.skillHits, note.skillId);

    var base = judgement === "perfect" ? 100 : judgement === "good" ? 70 : 40;
    var multiplier = this.getMultiplier();
    var bonus = note.flags && note.flags.specialPhrase ? 25 : 0;
    this.state.score += (base * multiplier) + bonus;
    if (note.flags && note.flags.specialPhrase) this.state.specialPhraseHits++;
    return { scoreDelta: (base * multiplier) + bonus, multiplier: multiplier, special: !!(note.flags && note.flags.specialPhrase) };
  };

  ScoringEngine.prototype.getMultiplier = function() {
    return Math.min(this.preset.maxMultiplier || 4, 1 + Math.floor(this.state.combo / (this.preset.comboStep || 10)));
  };

  ScoringEngine.prototype.toSummary = function() {
    var accuracy = this.state.total > 0 ? this.state.hits / this.state.total : 0;
    var averageTimingOffsetMs = this.state.judgedHits > 0 ? this.state.totalTimingOffsetMs / this.state.judgedHits : 0;
    var missWindowMs = this.preset && this.preset.hitWindowMs ? this.preset.hitWindowMs.miss : 100;
    var timing = this.state.judgedHits > 0
      ? Math.max(0, 1 - (averageTimingOffsetMs / Math.max(1, missWindowMs)))
      : 0;
    return {
      gameplay: {
        score: this.state.score,
        maxCombo: this.state.maxCombo,
        accuracy: Number(accuracy.toFixed(2)),
        timing: Number(timing.toFixed(2)),
        mistakes: this.state.misses,
        starPowerUses: 0,
        specialPhraseHits: this.state.specialPhraseHits
      },
      learning: {
        weakReasons: this.state.weakReasons,
        laneErrors: this.state.laneErrors,
        skillHits: this.state.skillHits,
        timingMs: Number(averageTimingOffsetMs.toFixed(2))
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
})();
