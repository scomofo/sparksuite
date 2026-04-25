(function() {
  function ScoringEngine(preset) {
    this.preset = preset || SparkEnginePresetRegistry.get("spark_learning");
    this.eventBus = null;
    this.state = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      hits: 0,
      misses: 0,
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
    this.state.combo++;
    if (this.state.combo > this.state.maxCombo) this.state.maxCombo = this.state.combo;
    if (note.skillId) bump(this.state.skillHits, note.skillId);

    var base = judgement === "perfect" ? 100 : judgement === "good" ? 70 : 40;
    var multiplier = this.getMultiplier();
    var bonus = note.flags && note.flags.specialPhrase ? 25 : 0;
    this.state.score += (base * multiplier) + bonus;
    if (note.flags && note.flags.specialPhrase) this.state.specialPhraseHits++;
    var applied = { scoreDelta: (base * multiplier) + bonus, multiplier: multiplier, special: !!(note.flags && note.flags.specialPhrase) };
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
    return Math.min(this.preset.maxMultiplier || 4, 1 + Math.floor(this.state.combo / (this.preset.comboStep || 10)));
  };

  ScoringEngine.prototype.toSummary = function() {
    var accuracy = this.state.total > 0 ? this.state.hits / this.state.total : 0;
    return {
      gameplay: {
        score: this.state.score,
        maxCombo: this.state.maxCombo,
        accuracy: Number(accuracy.toFixed(2)),
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
})();
