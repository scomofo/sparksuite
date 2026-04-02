(function(){
  function createSparkChart(){
    return {
      id: "",
      songId: "",
      arrangementType: "",
      bpm: 80,
      title: "",
      events: [],
      phrases: [],
      metadata: {}
    };
  }

  function createSparkEvent(){
    return {
      id: "",
      t: 0,
      dur: 1,
      type: "",
      hand: "",
      notes: [],
      chord: "",
      lane: "",
      velocity: 100
    };
  }

  function createSparkPhrase(){
    return {
      id: "",
      startSec: 0,
      endSec: 0,
      label: ""
    };
  }

  window.createSparkChart = createSparkChart;
  window.createSparkEvent = createSparkEvent;
  window.createSparkPhrase = createSparkPhrase;
})();
