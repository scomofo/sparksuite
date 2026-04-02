(function(){
  function beginGhostPreview(kind, id, bounds){
    S.editorGhostState = {
      kind:kind,
      id:String(id),
      bounds:bounds ? JSON.parse(JSON.stringify(bounds)) : null
    };
  }

  function updateGhostPreview(bounds){
    if(!S.editorGhostState) return false;
    S.editorGhostState.bounds = bounds ? JSON.parse(JSON.stringify(bounds)) : null;
    return true;
  }

  function clearGhostPreview(){
    S.editorGhostState = null;
  }

  window.beginGhostPreview = beginGhostPreview;
  window.updateGhostPreview = updateGhostPreview;
  window.clearGhostPreview = clearGhostPreview;
})();
