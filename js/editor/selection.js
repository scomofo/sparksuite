(function(){
  function editorSelectionState(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    if(typeof globalThis !== "undefined"){
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function clearEditorSelection(){
    var state = editorSelectionState();
    if(!state) return;
    state.editorSelectionIds = [];
    state.editorPrimarySelectionId = null;
    state.editorSelectedId = null;
  }

  function selectSingleEditorItem(id){
    var state = editorSelectionState();
    if(!state) return;
    state.editorSelectionIds = [String(id)];
    state.editorPrimarySelectionId = String(id);
    state.editorSelectedId = String(id);
    state.editorSelectionMode = "single";
  }

  function toggleEditorSelection(id){
    var state = editorSelectionState();
    if(!state) return;
    id = String(id);
    if(!Array.isArray(state.editorSelectionIds)) state.editorSelectionIds = [];
    var idx = state.editorSelectionIds.indexOf(id);
    if(idx >= 0){
      state.editorSelectionIds.splice(idx, 1);
      if(state.editorPrimarySelectionId===id){
        state.editorPrimarySelectionId = state.editorSelectionIds.length ? state.editorSelectionIds[0] : null;
        state.editorSelectedId = state.editorPrimarySelectionId;
      }
    }else{
      state.editorSelectionIds.push(id);
      state.editorPrimarySelectionId = id;
      state.editorSelectedId = id;
    }
    state.editorSelectionMode = state.editorSelectionIds.length > 1 ? "multi" : "single";
  }

  function addEditorSelection(id){
    var state = editorSelectionState();
    if(!state) return;
    id = String(id);
    if(!Array.isArray(state.editorSelectionIds)) state.editorSelectionIds = [];
    if(state.editorSelectionIds.indexOf(id) < 0){
      state.editorSelectionIds.push(id);
    }
    state.editorPrimarySelectionId = id;
    state.editorSelectedId = id;
    state.editorSelectionMode = state.editorSelectionIds.length > 1 ? "multi" : "single";
  }

  function isEditorItemSelected(id){
    var state = editorSelectionState();
    return !!state && Array.isArray(state.editorSelectionIds) && state.editorSelectionIds.indexOf(String(id)) >= 0;
  }

  function getSelectedEditorItems(){
    var state = editorSelectionState();
    if(!state || !state.editorObject || !Array.isArray(state.editorSelectionIds)) return [];
    var out = [];
    var groups = []
      .concat(state.editorObject.events || [])
      .concat(state.editorObject.phrases || [])
      .concat(state.editorObject.steps || []);
    for(var i=0;i<groups.length;i++){
      if(state.editorSelectionIds.indexOf(String(groups[i].id)) >= 0){
        out.push(groups[i]);
      }
    }
    return out;
  }

  window.clearEditorSelection = clearEditorSelection;
  window.selectSingleEditorItem = selectSingleEditorItem;
  window.toggleEditorSelection = toggleEditorSelection;
  window.addEditorSelection = addEditorSelection;
  window.isEditorItemSelected = isEditorItemSelected;
  window.getSelectedEditorItems = getSelectedEditorItems;
})();
