(function(){
  function clearEditorSelection(){
    S.editorSelectionIds = [];
    S.editorPrimarySelectionId = null;
    S.editorSelectedId = null;
  }

  function selectSingleEditorItem(id){
    S.editorSelectionIds = [String(id)];
    S.editorPrimarySelectionId = String(id);
    S.editorSelectedId = String(id);
    S.editorSelectionMode = "single";
  }

  function toggleEditorSelection(id){
    id = String(id);
    if(!Array.isArray(S.editorSelectionIds)) S.editorSelectionIds = [];
    var idx = S.editorSelectionIds.indexOf(id);
    if(idx >= 0){
      S.editorSelectionIds.splice(idx, 1);
      if(S.editorPrimarySelectionId===id){
        S.editorPrimarySelectionId = S.editorSelectionIds.length ? S.editorSelectionIds[0] : null;
        S.editorSelectedId = S.editorPrimarySelectionId;
      }
    }else{
      S.editorSelectionIds.push(id);
      S.editorPrimarySelectionId = id;
      S.editorSelectedId = id;
    }
    S.editorSelectionMode = S.editorSelectionIds.length > 1 ? "multi" : "single";
  }

  function addEditorSelection(id){
    id = String(id);
    if(!Array.isArray(S.editorSelectionIds)) S.editorSelectionIds = [];
    if(S.editorSelectionIds.indexOf(id) < 0){
      S.editorSelectionIds.push(id);
    }
    S.editorPrimarySelectionId = id;
    S.editorSelectedId = id;
    S.editorSelectionMode = S.editorSelectionIds.length > 1 ? "multi" : "single";
  }

  function isEditorItemSelected(id){
    return Array.isArray(S.editorSelectionIds) && S.editorSelectionIds.indexOf(String(id)) >= 0;
  }

  function getSelectedEditorItems(){
    if(!S.editorObject || !Array.isArray(S.editorSelectionIds)) return [];
    var out = [];
    var groups = []
      .concat(S.editorObject.events || [])
      .concat(S.editorObject.phrases || [])
      .concat(S.editorObject.steps || []);
    for(var i=0;i<groups.length;i++){
      if(S.editorSelectionIds.indexOf(String(groups[i].id)) >= 0){
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
