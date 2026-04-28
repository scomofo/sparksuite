(function(){
  var CHARTS={
    drums_lane_tap_01:{
      id:"drums_lane_tap_01",
      laneCount:4,
      laneLabels:["Kick","Snare","Hat","Aux"],
      bpm:60,
      totalBeats:8,
      notes:[
        {beat:0,laneIndex:0},{beat:1,laneIndex:1},{beat:2,laneIndex:2},{beat:3,laneIndex:0}
      ]
    },
    drums_backbeat_01:{
      id:"drums_backbeat_01",
      laneCount:4,
      laneLabels:["Kick","Snare","Hat","Aux"],
      bpm:72,
      totalBeats:16,
      notes:[
        {beat:0,laneIndex:0},{beat:1,laneIndex:2},{beat:2,laneIndex:1},{beat:3,laneIndex:2}
      ]
    }
  };
  window.SparkDrumsChartLibrary={
    getChartDefinition:function(id){return CHARTS[id]||CHARTS.drums_lane_tap_01;}
  };
})();
