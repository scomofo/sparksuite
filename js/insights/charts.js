(function(){

  function renderInsightLineChart(series, width, height){
    series = series || [];
    width = width || 320;
    height = height || 120;
    if(!series.length){
      return '<div class="muted">No data yet.</div>';
    }
    var max = 0;
    for(var i=0;i<series.length;i++){
      max = Math.max(max, series[i].value || 0);
    }
    max = max || 1;
    var path = '';
    for(var j=0;j<series.length;j++){
      var x = (j / Math.max(1, series.length - 1)) * width;
      var y = height - ((series[j].value || 0) / max) * height;
      path += (j === 0 ? 'M' : 'L') + x + ' ' + y + ' ';
    }
    return '<svg width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'">' +
      '<path d="'+path+'" fill="none" stroke="white" stroke-width="2"></path>' +
      '</svg>';
  }

  function renderInsightBarChart(items, width, height){
    items = items || [];
    width = width || 320;
    height = height || 120;
    if(!items.length){
      return '<div class="muted">No data yet.</div>';
    }
    var max = 0;
    for(var i=0;i<items.length;i++){
      max = Math.max(max, items[i].value || 0);
    }
    max = max || 1;
    var barW = width / items.length;
    var h = '<svg width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'">';
    for(var j=0;j<items.length;j++){
      var v = items[j].value || 0;
      var bh = (v / max) * height;
      var x = j * barW;
      var y = height - bh;
      h += '<rect x="'+x+'" y="'+y+'" width="'+Math.max(8, barW - 4)+'" height="'+bh+'" fill="white"></rect>';
    }
    h += '</svg>';
    return h;
  }

  window.renderInsightLineChart = renderInsightLineChart;
  window.renderInsightBarChart = renderInsightBarChart;

})();
