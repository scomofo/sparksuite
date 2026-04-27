(function(){
  var MAP={
    pno_quarter_pulse:"pno_pulse_01",
    pno_c_major:"pno_chord_01",
    pno_switch:"pno_switch_01",
    pno_arpeggio:"pno_arp_01",
    pno_melody:"pno_melody_01",
    pno_performance:"pno_perf_01"
  };
  function skillOf(id){var ls=window.SparkPianoLessons||[];for(var i=0;i<ls.length;i++){if(ls[i].id===id)return ls[i].skill;}return "pno_quarter_pulse";}
  function selectChart(ctx){var id=ctx&&ctx.curriculum&&ctx.curriculum.nextLessonId;var s=skillOf(id);return MAP[s]||"pno_pulse_01";}
  window.SparkPianoModule={
    id:"piano",
    getSkillTree:function(){return window.SparkPianoSkillTree||[];},
    getLessons:function(){return window.SparkPianoLessons||[];},
    getCurriculum:function(){return window.SparkPianoCurriculum||null;},
    getExercises:function(skill){return (window.SparkPianoExercises||{})[skill]||[];},
    getRuntimeAdapter:function(){return new SparkPianoRuntimeAdapter();},
    selectChartId:selectChart
  };
})();