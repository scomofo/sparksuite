(function() {
  /**
   * SparkPatternLibrary — rhythm and strumming patterns by difficulty.
   * Used by ChartBuilder to place notes in musically coherent positions.
   */
  var SparkPatternLibrary = {
    rhythm: {
      easy:   [1, 0, 1, 0],
      normal: [1, 1, 0, 1],
      hard:   [1, 1, 1, 1]
    },
    strumming: {
      easy:   ["D D D D"],
      normal: ["D DU UDU"],
      hard:   ["DUDU DUUD"]
    }
  };

  window.SparkPatternLibrary = SparkPatternLibrary;
})();
