(function(){

  function getCurriculumUiRuntimeState(){
    var core = (typeof window !== "undefined" && window.sparkCore)
      || (typeof sparkCore !== "undefined" ? sparkCore : null);
    return core && typeof core.getRuntimeState === "function" ? core.getRuntimeState() : null;
  }

  function curriculumPage(){
    var runtimeState = getCurriculumUiRuntimeState();
    var h = '<div class="card">';
    h += '<div><b>Curriculum</b></div>';
    if(runtimeState && runtimeState.curriculumLoading){
      h += '<div>Loading curriculum...</div>';
    } else if(runtimeState && runtimeState.curriculumLastManifestPath){
      h += '<div style="font-size:12px;color:var(--text-muted)">Manifest: ' + escHTML(runtimeState.curriculumLastManifestPath) + ' [' + escHTML(runtimeState.curriculumLastLoadStatus || "idle") + ']</div>';
    }

    var runtimeCurriculums = runtimeState && Array.isArray(runtimeState.curriculumSummaries) && runtimeState.curriculumSummaries.length
      ? runtimeState.curriculumSummaries
      : null;
    var curriculums = SparkCurriculum.curriculums || {};
    var ids = Object.keys(curriculums);
    if(runtimeCurriculums && runtimeCurriculums.length){
      for(var rc=0;rc<runtimeCurriculums.length;rc++){
        var summary = runtimeCurriculums[rc];
        h += '<div style="margin-bottom:12px">';
        h += '<div><b>' + escHTML(summary.title || summary.id || "Curriculum") + '</b></div>';
        h += '<div style="margin-left:12px">' + (summary.trackCount || 0) + ' tracks</div>';
        h += '</div>';
      }
      h += '</div>';
    } else if(!ids.length){
      h += '<div>No curriculum loaded</div>';
      h += '</div>';
      return h;
    } else {
      for(var c=0;c<ids.length;c++){
        var cur = curriculums[ids[c]];
        h += '<div style="margin-bottom:12px">';
        h += '<div><b>' + escHTML(cur.title || cur.id) + '</b></div>';
        var tracks = cur.tracks || [];
        for(var t=0;t<tracks.length;t++){
          var track = getCurriculumItem("tracks", tracks[t]);
          if(!track) continue;
          h += '<div style="margin-left:12px">';
          h += '<div><i>' + escHTML(track.title || track.id) + '</i></div>';
          var units = track.units || [];
          for(var u=0;u<units.length;u++){
            var unit = getCurriculumItem("units", units[u]);
            if(!unit) continue;
            h += '<div style="margin-left:24px">';
            h += escHTML(unit.title || unit.id);
            h += ' (' + (unit.lessons || []).length + ' lessons)';
            h += '</div>';
          }
          h += '</div>';
        }
        h += '</div>';
      }
      h += '</div>';
      h += '</div>';
    }

    // Packs section
    var runtimePacks = runtimeState && Array.isArray(runtimeState.curriculumPackSummaries) && runtimeState.curriculumPackSummaries.length
      ? runtimeState.curriculumPackSummaries
      : null;
    var packs = SparkContent.packs || {};
    var packIds = Object.keys(packs);
    if((runtimePacks && runtimePacks.length) || packIds.length){
      h += '<div class="card">';
      h += '<div><b>Content Packs</b></div>';
      if(runtimeState && runtimeState.contentLoading){
        h += '<div>Loading content...</div>';
      } else if(runtimeState && runtimeState.contentLastManifestPath){
        h += '<div style="font-size:12px;color:var(--text-muted)">Content Manifest: ' + escHTML(runtimeState.contentLastManifestPath) + ' [' + escHTML(runtimeState.contentLastLoadStatus || "idle") + ']</div>';
      }
      if(runtimePacks && runtimePacks.length){
        for(var rp=0;rp<runtimePacks.length;rp++){
          var packSummary = runtimePacks[rp];
          h += '<div>' + escHTML(packSummary.title || packSummary.id || "Pack") + ' [' + escHTML(packSummary.type || "pack") + ']</div>';
        }
      } else {
        for(var p=0;p<packIds.length;p++){
          var pack = packs[packIds[p]];
          h += '<div>' + escHTML(pack.title || pack.id) + ' [' + (pack.type || "pack") + ']</div>';
        }
      }
      h += '</div>';
    }

    return h;
  }

  window.curriculumPage = curriculumPage;

})();
