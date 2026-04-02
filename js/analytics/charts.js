(function(){

  function renderLineChart(data, field, width, height){
    if(!data || !data.length) return '';
    var max = 0;
    for(var i=0;i<data.length;i++){
      if(data[i][field] > max) max = data[i][field];
    }
    if(max === 0) max = 1;
    var path = '';
    for(var j=0;j<data.length;j++){
      var x = data.length === 1 ? width/2 : (j / (data.length - 1)) * width;
      var y = height - ((data[j][field] / max) * height);
      path += (j===0 ? 'M' : 'L') + x + ' ' + y + ' ';
    }
    return '<svg width="'+width+'" height="'+height+'"><path d="'+path+'" stroke="white" fill="none" stroke-width="2"/></svg>';
  }

  window.renderLineChart = renderLineChart;

})();
