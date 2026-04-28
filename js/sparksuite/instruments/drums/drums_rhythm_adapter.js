(function(){
  function DrumsRhythmAdapter(){}
  DrumsRhythmAdapter.prototype.getLaneCount=function(){return 4;};
  DrumsRhythmAdapter.prototype.getLaneLabels=function(){return ["Kick","Snare","Hat","Aux"];};
  DrumsRhythmAdapter.prototype.getDefaultInputMode=function(){return "keyboard_or_midi";};
  DrumsRhythmAdapter.prototype.createPayload=function(ctx){
    var lessonId=ctx&&ctx.curriculum&&ctx.curriculum.nextLessonId;
    var chartId=lessonId&&lessonId.indexOf("backbeat")>=0?"drums_backbeat_01":"drums_lane_tap_01";
    var def=window.SparkDrumsChartLibrary.getChartDefinition(chartId);
    return {
      chartId:chartId,
      adapterType:"drums",
      laneCount:4,
      laneLabels:this.getLaneLabels(),
      songChart:def
    };
  };
  window.SparkDrumsRhythmAdapter=DrumsRhythmAdapter;
})();
