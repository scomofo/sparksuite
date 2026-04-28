(function(){
  window.SparkDrumsModule={
    id:"drums",
    getSkillTree:function(){return window.SparkDrumsSkillTree||[];},
    getLessons:function(){return window.SparkDrumsLessons||[];},
    getRhythmAdapter:function(){return new SparkDrumsRhythmAdapter();},
    getRuntimeAdapter:function(){return new SparkDrumsRhythmAdapter();}
  };
})();
