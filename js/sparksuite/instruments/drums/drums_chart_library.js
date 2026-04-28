(function(){
  function note(beat,laneIndex,velocity,skill,kind){
    return {beat:beat,laneIndex:laneIndex,velocity:velocity||1,skillId:skill||"groove_consistency",kind:kind||"hit"};
  }

  var LANES=["Kick","Snare","Hat","Aux"];

  var CHARTS={
    drums_lane_tap_01:{
      id:"drums_lane_tap_01",
      title:"Lane Tap Orientation",
      laneCount:4,
      laneLabels:LANES,
      bpm:60,
      totalBeats:8,
      timingWindowMs:{perfect:55,good:95,late:140},
      groove:{feel:"straight",swing:0,humanizeMs:0},
      notes:[
        note(0,0,1,"kit_orientation"),
        note(1,1,1,"kit_orientation"),
        note(2,2,1,"kit_orientation"),
        note(3,3,0.8,"kit_orientation","crash")
      ],
      phrases:[{id:"lanes",name:"Kick Snare Hat Crash",startBeat:0,endBeat:4}]
    },

    drums_quarter_hat_01:{
      id:"drums_quarter_hat_01",
      title:"Quarter Note Hat Pulse",
      laneCount:4,
      laneLabels:LANES,
      bpm:64,
      totalBeats:8,
      timingWindowMs:{perfect:50,good:90,late:135},
      groove:{feel:"straight",swing:0,humanizeMs:2},
      notes:[note(0,2,0.9,"counting_quarters"),note(1,2,0.8,"counting_quarters"),note(2,2,0.9,"counting_quarters"),note(3,2,0.8,"counting_quarters")],
      phrases:[{id:"pulse",name:"Count 1 2 3 4",startBeat:0,endBeat:4}]
    },

    drums_single_strokes_01:{
      id:"drums_single_strokes_01",
      title:"Single Strokes R L R L",
      laneCount:4,
      laneLabels:LANES,
      bpm:68,
      totalBeats:8,
      timingWindowMs:{perfect:50,good:90,late:135},
      groove:{feel:"straight",swing:0,humanizeMs:2},
      notes:[note(0,1,1,"single_strokes","R"),note(1,1,0.85,"single_strokes","L"),note(2,1,1,"single_strokes","R"),note(3,1,0.85,"single_strokes","L")],
      phrases:[{id:"rlrl",name:"R L R L",startBeat:0,endBeat:4}]
    },

    drums_kick_control_01:{
      id:"drums_kick_control_01",
      title:"Kick Control With Hat",
      laneCount:4,
      laneLabels:LANES,
      bpm:70,
      totalBeats:16,
      timingWindowMs:{perfect:55,good:95,late:145},
      groove:{feel:"straight",swing:0,humanizeMs:3},
      notes:[note(0,0,1,"kick_control"),note(0,2,0.8,"kick_control"),note(1,2,0.65,"kick_control"),note(2,2,0.8,"kick_control"),note(3,2,0.65,"kick_control"),note(4,0,1,"kick_control"),note(4,2,0.8,"kick_control"),note(5,2,0.65,"kick_control"),note(6,2,0.8,"kick_control"),note(7,2,0.65,"kick_control")],
      phrases:[{id:"kick-hat",name:"Kick plus hat",startBeat:0,endBeat:8}]
    },

    drums_backbeat_01:{
      id:"drums_backbeat_01",
      title:"First Backbeat",
      laneCount:4,
      laneLabels:LANES,
      bpm:72,
      totalBeats:16,
      timingWindowMs:{perfect:45,good:85,late:130},
      groove:{feel:"straight",swing:0,humanizeMs:4},
      notes:[
        note(0,0,1,"basic_backbeat"),note(0,2,0.75,"basic_backbeat"),
        note(1,2,0.55,"basic_backbeat"),
        note(2,1,1,"basic_backbeat"),note(2,2,0.75,"basic_backbeat"),
        note(3,2,0.55,"basic_backbeat"),
        note(4,0,1,"basic_backbeat"),note(4,2,0.75,"basic_backbeat"),
        note(5,2,0.55,"basic_backbeat"),
        note(6,1,1,"basic_backbeat"),note(6,2,0.75,"basic_backbeat"),
        note(7,2,0.55,"basic_backbeat")
      ],
      phrases:[{id:"backbeat",name:"Kick 1 and 3, snare 2 and 4",startBeat:0,endBeat:8}]
    },

    drums_fill_01:{
      id:"drums_fill_01",
      title:"One Bar Fill To Crash",
      laneCount:4,
      laneLabels:LANES,
      bpm:76,
      totalBeats:16,
      timingWindowMs:{perfect:50,good:90,late:135},
      groove:{feel:"straight",swing:0,humanizeMs:4},
      notes:[note(0,2,0.7,"one_bar_fills"),note(1,1,0.75,"one_bar_fills"),note(2,1,0.85,"one_bar_fills"),note(3,1,0.95,"one_bar_fills"),note(4,3,1,"one_bar_fills","crash"),note(4,0,1,"one_bar_fills")],
      phrases:[{id:"fill-crash",name:"Fill and land",startBeat:0,endBeat:5}]
    }
  };

  window.SparkDrumsChartLibrary={
    getChartDefinition:function(id){return CHARTS[id]||CHARTS.drums_lane_tap_01;},
    getAll:function(){return CHARTS;}
  };
})();
