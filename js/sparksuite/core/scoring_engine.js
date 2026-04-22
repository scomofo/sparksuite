(function() {
  function ScoringEngine(preset) {
    this.preset = preset || SparkEnginePresetRegistry.get("spark_learning");
    this.state = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      hits: 0,
      misses: 0,
      total: 0,
      specialPhraseHits: 0,
      energy: 80,
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
      this.state.combo = 0;
      this.state.energy = Math.max(0, this.state.energy - 10);
      bump(this.state.weakReasons, resolution.reason || "miss");
      return { scoreDelta: 0, multiplier: this.getMultiplier(), special: false };
    }

    if (judgement === "miss") {
      this.state.combo = 0;
      this.state.misses++;
      this.state.energy = Math.max(0, this.state.energy - 10);
      bump(this.state.weakReasons, resolution.reason || "miss");
      bump(this.state.laneErrors, maskLabel(note.laneMask));
      return { scoreDelta: 0, multiplier: this.getMultiplier(), special: false };
    }

    this.state.hits++;
    this.state.combo++;
    this.state.energy = Math.min(100, this.state.energy + 2);
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
    return {
      gameplay: {
        score: this.state.score,
        combo: this.state.combo,
        maxCombo: this.state.maxCombo,
        multiplier: this.getMultiplier(),
        energy: this.state.energy,
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
