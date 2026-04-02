(function(){
  function createPerformanceResult(){
    return {
      songId: "",
      arrangementType: "",
      accuracy: 0,
      score: 0,
      maxCombo: 0,
      durationMin: 0,
      phrases: [],
      chords: {},
      transitions: {},
      rhythm: {},
      timing: {
        early: 0,
        late: 0,
        perfect: 0
      },
      ts: Date.now()
    };
  }

  window.createPerformanceResult = createPerformanceResult;
})();
