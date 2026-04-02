(function(){

  async function loadContentManifest(path){
    var res = await fetch(path);
    return await res.json();
  }

  async function loadContentFile(path){
    var res = await fetch(path);
    return await res.json();
  }

  async function loadAllContent(manifestPath){
    var manifest = await loadContentManifest(manifestPath);
    if(manifest.lessons){
      registerContent("lessons", await loadContentFile(manifest.lessons));
    }
    if(manifest.songs){
      registerContent("songs", await loadContentFile(manifest.songs));
    }
    if(manifest.drills){
      registerContent("drills", await loadContentFile(manifest.drills));
    }
    if(manifest.templates){
      registerContent("templates", await loadContentFile(manifest.templates));
    }
    if(manifest.packs){
      registerContent("packs", await loadContentFile(manifest.packs));
    }
    return manifest;
  }

  window.loadAllContent = loadAllContent;

})();
