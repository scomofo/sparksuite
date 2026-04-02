(function(){

  window.SparkCurriculum = {
    curriculums: {},
    tracks: {},
    units: {},
    lessons: {}
  };

  function registerCurriculum(type, items){
    if(!SparkCurriculum[type]) SparkCurriculum[type] = {};
    for(var i=0;i<items.length;i++){
      SparkCurriculum[type][items[i].id] = items[i];
    }
  }

  function getCurriculumItem(type, id){
    return SparkCurriculum[type] ? SparkCurriculum[type][id] : null;
  }

  window.registerCurriculum = registerCurriculum;
  window.getCurriculumItem = getCurriculumItem;

})();
