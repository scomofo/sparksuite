(function(){
  var map={};
  var lessons=window.SparkPianoLessons||[];
  for(var i=0;i<lessons.length;i++){
    var l=lessons[i];
    map[l.skill]=[{id:l.id+"_ex",lessonId:l.id,skill:l.skill,type:"practice",durationSec:60}];
  }
  window.SparkPianoExercises=map;
})();