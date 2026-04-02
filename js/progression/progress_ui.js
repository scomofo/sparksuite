function progressionPage(){
  var h = '<div class="card">';
  h += '<div><b>Progress</b></div>';
  h += '<div>Chord Mastery: '+Math.round(getAverageMastery("chords")*100)+'%</div>';
  h += '<div>Rhythm Mastery: '+Math.round(getAverageMastery("rhythm")*100)+'%</div>';
  h += '<div>Transition Mastery: '+Math.round(getAverageMastery("transitions")*100)+'%</div>';
  h += '<div>Song Mastery: '+Math.round(getAverageMastery("songs")*100)+'%</div>';
  h += '</div>';
  return h;
}
