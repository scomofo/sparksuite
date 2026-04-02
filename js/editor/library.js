(function(){

  S.contentLibrary = S.contentLibrary || {
    rhythmPatterns:[],
    lhPatterns:[],
    chordProgressions:[],
    exercises:[]
  };

  function saveTemplate(type, template){
    if(!S.contentLibrary[type]) S.contentLibrary[type] = [];
    S.contentLibrary[type].push(template);
    saveState();
  }

  function getTemplates(type){
    return S.contentLibrary[type] || [];
  }

  window.saveTemplate = saveTemplate;
  window.getTemplates = getTemplates;

})();
