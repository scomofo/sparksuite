(function() {
  function GameplayResult(input) {
    input = input || {};
    this.gameplay = input.gameplay || {};
    this.learning = input.learning || {};
    this.replay = input.replay || {};
  }

  window.SparkGameplayResult = GameplayResult;
})();
