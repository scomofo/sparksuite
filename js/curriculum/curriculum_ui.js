(function(){

  function curriculumPage(){
    var h = '<div class="card">';
    h += '<div><b>Curriculum</b></div>';

    var curriculums = SparkCurriculum.curriculums || {};
    var ids = Object.keys(curriculums);
    if(!ids.length){
      h += '<div>No curriculum loaded</div>';
      h += '</div>';
      return h;
    }

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

    // Packs section
    var packs = SparkContent.packs || {};
    var packIds = Object.keys(packs);
    if(packIds.length){
      h += '<div class="card">';
      h += '<div><b>Content Packs</b></div>';
      for(var p=0;p<packIds.length;p++){
        var pack = packs[packIds[p]];
        h += '<div>' + escHTML(pack.title || pack.id) + ' [' + (pack.type || "pack") + ']</div>';
      }
      h += '</div>';
    }

    return h;
  }

  window.curriculumPage = curriculumPage;

})();
