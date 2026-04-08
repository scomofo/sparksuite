(function(){
  if (!window.location.search.includes('dev=1')) return;

  function renderOverlay(){
    let el = document.getElementById('dev-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'dev-overlay';
      el.style.position = 'fixed';
      el.style.top = '0';
      el.style.right = '0';
      el.style.background = 'rgba(0,0,0,0.8)';
      el.style.color = '#0f0';
      el.style.fontSize = '12px';
      el.style.padding = '10px';
      el.style.zIndex = '9999';
      document.body.appendChild(el);
    }

    el.innerHTML = `
      <div><strong>DEV MODE</strong></div>
      <div>Instrument: ${window.S?.activeInstrument}</div>
      <div>Screen: ${window.S?.screen}</div>
      <div>Tab: ${window.S?.tab}</div>
      <div>Reload: ${localStorage.getItem('preview_reload')}</div>
    `;
  }

  setInterval(renderOverlay, 1000);
})();
