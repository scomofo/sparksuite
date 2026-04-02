function renderHomeGrid(cards){
  var h = '<div class="home-grid">';
  for(var i=0;i<cards.length;i++){
    h += '<div class="home-grid-item">'+cards[i]+'</div>';
  }
  h += '</div>';
  return h;
}
