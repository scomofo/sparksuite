// ID helper — formerly js/core/utils/ids.js; kept as a shared utility when
// js/core/ was retired. Used by midi import, meta challenges/goals, and
// recommendation candidates.
(function(){
  function generateId(prefix){
    return prefix + "_" + Math.random().toString(36).substr(2,9);
  }

  window.generateId = generateId;
})();
