(function(){
  function generateId(prefix){
    return prefix + "_" + Math.random().toString(36).substr(2,9);
  }

  window.generateId = generateId;
})();
