(function(){

  function buildPersistedStateSnapshot(state, fields){
    var out = {};
    for(var i=0;i<fields.length;i++){
      var key = fields[i];
      out[key] = state[key];
    }
    return out;
  }

  function applyPersistedStateSnapshot(state, snapshot, fields){
    if(!snapshot) return;
    for(var i=0;i<fields.length;i++){
      var key = fields[i];
      if(snapshot[key] !== undefined){
        state[key] = snapshot[key];
      }
    }
  }

  function capArray(arr, maxLen){
    if(!Array.isArray(arr)) return [];
    if(arr.length <= maxLen) return arr;
    return arr.slice(arr.length - maxLen);
  }

  function safeJsonParse(raw, fallback){
    try{ return JSON.parse(raw); }catch(e){ return fallback; }
  }

  function createDebouncedSaver(fn, waitMs){
    var t = null;
    return function(immediate){
      if(immediate){
        clearTimeout(t);
        t = null;
        fn();
        return;
      }
      clearTimeout(t);
      t = setTimeout(fn, waitMs || 300);
    };
  }

  function backupPersistedState(storageKey, state, fields){
    try{
      var data = buildPersistedStateSnapshot(state, fields);
      localStorage.setItem(storageKey, JSON.stringify(data));
      return true;
    }catch(e){
      console.error("Spark: backupPersistedState failed", e);
      return false;
    }
  }

  function restorePersistedState(storageKey, state, fields){
    try{
      var raw = localStorage.getItem(storageKey);
      if(!raw) return false;
      var data = safeJsonParse(raw, null);
      if(!data) return false;
      applyPersistedStateSnapshot(state, data, fields);
      return true;
    }catch(e){
      console.error("Spark: restorePersistedState failed", e);
      return false;
    }
  }

  function removePersistedBackup(storageKey){
    try{ localStorage.removeItem(storageKey); }
    catch(e){ console.error("Spark: removePersistedBackup failed", e); }
  }

  window.buildPersistedStateSnapshot = buildPersistedStateSnapshot;
  window.applyPersistedStateSnapshot = applyPersistedStateSnapshot;
  window.capArray = capArray;
  window.safeJsonParse = safeJsonParse;
  window.createDebouncedSaver = createDebouncedSaver;
  window.backupPersistedState = backupPersistedState;
  window.restorePersistedState = restorePersistedState;
  window.removePersistedBackup = removePersistedBackup;

})();
