(function(){

  window.SparkContent = {
    lessons: {},
    songs: {},
    drills: {},
    templates: {},
    packs: {}
  };

  function registerContent(type, items){
    if(!SparkContent[type]) SparkContent[type] = {};
    for(var i=0;i<items.length;i++){
      SparkContent[type][items[i].id] = items[i];
    }
  }

  function getContent(type, id){
    return SparkContent[type] ? SparkContent[type][id] : null;
  }

  window.registerContent = registerContent;
  window.getContent = getContent;

})();
