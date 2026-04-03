(function() {
  function SparkPhrase(input) {
    input = input || {};
    this.id = input.id || 0;
    this.name = input.name || "Phrase";
    this.startTick = input.startTick || 0;
    this.endTick = input.endTick || 0;
    this.flags = input.flags || {};
  }

  window.SparkPhrase = SparkPhrase;
})();
