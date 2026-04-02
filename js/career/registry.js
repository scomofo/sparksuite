(function(){

  window.SparkCareer = {
    careers: {},
    tiers: {},
    stages: {},
    songs: {}
  };

  function registerCareerContent(type, items){
    if(!SparkCareer[type]) SparkCareer[type] = {};
    for(var i=0;i<items.length;i++){
      SparkCareer[type][items[i].id] = items[i];
    }
  }

  function getCareerItem(type, id){
    return SparkCareer[type] ? SparkCareer[type][id] : null;
  }

  window.registerCareerContent = registerCareerContent;
  window.getCareerItem = getCareerItem;

})();
