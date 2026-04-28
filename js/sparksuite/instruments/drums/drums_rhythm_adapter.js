(function(){
  function DrumsRhythmAdapter(){}

  DrumsRhythmAdapter.prototype.getLaneCount=function(){return 4;};

  DrumsRhythmAdapter.prototype.getLaneLabels=function(){return ["Kick","Snare","Hat","Aux"];};

  DrumsRhythmAdapter.prototype.getDefaultInputMode=function(){return "keyboard_or_midi";};

  DrumsRhythmAdapter.prototype.getTimingWindow=function(){
    return {perfect:50,good:90,late:135};
  };

  DrumsRhythmAdapter.prototype.applyGroove=function(notes,groove){
    if(!groove||!notes) return notes;
    var swing=groove.swing||0;
    var humanize=groove.humanizeMs||0;
    for(var i=0;i<notes.length;i++){
      var n=notes[i];
      if(swing&&n.beat%2===1){
        n.beat+=swing*0.1;
      }
      if(humanize){
        n.offsetMs=(Math.random()*2-1)*humanize;
      }
    }
    return notes;
  };

  DrumsRhythmAdapter.prototype.createPayload=function(ctx){
    var lessonId=ctx&&ctx.curriculum&&ctx.curriculum.nextLessonId;
    var chartId="drums_lane_tap_01";
    if(lessonId){
      if(lessonId.indexOf("backbeat")>=0) chartId="drums_backbeat_01";
      else if(lessonId.indexOf("fill")>=0) chartId="drums_fill_01";
      else if(lessonId.indexOf("kick")>=0) chartId="drums_kick_control_01";
      else if(lessonId.indexOf("single")>=0) chartId="drums_single_strokes_01";
      else if(lessonId.indexOf("count")>=0) chartId="drums_quarter_hat_01";
    }

    var def=window.SparkDrumsChartLibrary.getChartDefinition(chartId);

    var notes=this.applyGroove(def.notes.slice(),def.groove);

    return {
      chartId:chartId,
      adapterType:"drums",
      laneCount:4,
      laneLabels:this.getLaneLabels(),
      timingWindow:def.timingWindowMs||this.getTimingWindow(),
      songChart:Object.assign({},def,{notes:notes})
    };
  };

  window.SparkDrumsRhythmAdapter=DrumsRhythmAdapter;
})();
