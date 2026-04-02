(function(){

  async function loadCurriculumManifest(path){
    var res = await fetch(path);
    var manifest = await res.json();
    if(manifest.curriculums){
      registerCurriculum("curriculums", await (await fetch(manifest.curriculums)).json());
    }
    if(manifest.tracks){
      registerCurriculum("tracks", await (await fetch(manifest.tracks)).json());
    }
    if(manifest.units){
      registerCurriculum("units", await (await fetch(manifest.units)).json());
    }
    if(manifest.lessons){
      registerCurriculum("lessons", await (await fetch(manifest.lessons)).json());
    }
    return manifest;
  }

  window.loadCurriculumManifest = loadCurriculumManifest;

})();
