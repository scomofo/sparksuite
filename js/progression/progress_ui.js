function progressionPage(){
  var h = '<div class="card">';
  h += '<div class="card-section-heading">Progress</div>';
  h += '<div>Chord Mastery: '+Math.round(getAverageMastery("chords"))+'%</div>';
  h += '<div>Rhythm Mastery: '+Math.round(getAverageMastery("rhythm"))+'%</div>';
  h += '<div>Transition Mastery: '+Math.round(getAverageMastery("transitions"))+'%</div>';
  h += '<div>Song Mastery: '+Math.round(getAverageMastery("songs"))+'%</div>';
  h += '</div>';
  return h;
}
