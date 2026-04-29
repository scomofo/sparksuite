(function(){

  function getCurriculumLoaderCore(){
    return (typeof window !== "undefined" && window.sparkCore)
      || (typeof sparkCore !== "undefined" ? sparkCore : null);
  }

  async function fetchCurriculumJson(path){
    var res = await fetch(path);
    if(!res.ok){
      throw new Error("Curriculum fetch failed: " + path);
    }
    return await res.json();
  }

  async function loadCurriculumManifest(path){
    var core = getCurriculumLoaderCore();
    if(core && typeof core.applyCurriculumWorkflowRequest === "function"){
      core.applyCurriculumWorkflowRequest("curriculum_load_start", { manifestPath: path });
    }
    try{
      var manifest = await fetchCurriculumJson(path);
      var pending = {};
      if(manifest.curriculums){
        pending.curriculums = await fetchCurriculumJson(manifest.curriculums);
      }
      if(manifest.tracks){
        pending.tracks = await fetchCurriculumJson(manifest.tracks);
      }
      if(manifest.units){
        pending.units = await fetchCurriculumJson(manifest.units);
      }
      if(manifest.lessons){
        pending.lessons = await fetchCurriculumJson(manifest.lessons);
      }
      for(var type in pending){
        if(Object.prototype.hasOwnProperty.call(pending, type)){
          registerCurriculum(type, pending[type]);
        }
      }
      if(core && typeof core.applyCurriculumWorkflowRequest === "function"){
        core.applyCurriculumWorkflowRequest("curriculum_load_done", { manifestPath: path, status: "ok" });
      }
      return manifest;
    }catch(err){
      if(core && typeof core.applyCurriculumWorkflowRequest === "function"){
        core.applyCurriculumWorkflowRequest("curriculum_load_error", { manifestPath: path, status: "error" });
      }
      throw err;
    }
  }

  window.loadCurriculumManifest = loadCurriculumManifest;

})();
