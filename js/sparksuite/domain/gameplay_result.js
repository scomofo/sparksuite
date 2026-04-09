(function() {
  function GameplayResult(input) {
    input = input || {};
    this.gameplay = input.gameplay || {};
    this.learning = input.learning || {};
    this.replay = input.replay || {};
    this.output = input.output || {
      accuracy: this.gameplay.accuracy || 0,
      timing: this.gameplay.timing || 0,
      mistakes: this.gameplay.mistakes || 0
    };
    this.accuracy = this.output.accuracy;
    this.timing = this.output.timing;
    this.mistakes = this.output.mistakes;
  }

  window.SparkGameplayResult = GameplayResult;
})();
