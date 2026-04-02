function careerPage(){
  var h = '<div class="card">';
  h += '<div><b>Career Mode</b></div>';
  var career = getCareerItem("careers", S.activeCareerId);
  if(!career){
    h += '<div>No career loaded.</div></div>';
    return h;
  }
  for(var t=0;t<career.tiers.length;t++){
    var tier = getCareerItem("tiers", career.tiers[t]);
    if(!tier) continue;
    h += '<div style="margin-top:16px"><b>'+escHTML(tier.title)+'</b></div>';
    for(var s=0;s<tier.stages.length;s++){
      var stage = getCareerItem("stages", tier.stages[s]);
      if(!stage) continue;
      h += '<div style="margin-left:12px;margin-top:8px">';
      h += '<div>'+escHTML(stage.title)+'</div>';
      for(var i=0;i<(stage.songs || []).length;i++){
        var songId = stage.songs[i];
        var unlocked = isCareerSongUnlocked(songId);
        h += '<div style="margin-left:12px;opacity:'+(unlocked?1:0.4)+'">';
        h += escHTML(songId) + ' ';
        if(unlocked){
          h += '<button onclick="act(\'openCareerSong\', \''+songId+'\')">Play</button>';
        }else{
          h += '<span>Locked</span>';
        }
        h += '</div>';
      }
      h += '</div>';
    }
  }
  h += '</div>';
  return h;
}
