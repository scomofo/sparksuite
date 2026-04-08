(function(){
  if (!window.location.search.includes('dev=1')) return;

  function render(){
    let el = document.getElementById('dev-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'dev-overlay';
      Object.assign(el.style, {
        position: 'fixed',
        top: '0',
        right: '0',
        background: 'rgba(0,0,0,0.85)',
        color: '#0f0',
        fontSize: '12px',
        padding: '10px',
        zIndex: 9999,
        maxWidth: '300px'
      });
      document.body.appendChild(el);
    }

    const manifest = window.SparkInstrumentDiscoveryManifest || [];
    const active = window.S?.activeInstrument;

    el.innerHTML = `
      <div><strong>DEV MODE</strong></div>
      <div>Instrument: ${active}</div>
      <div>Screen: ${window.S?.screen}</div>
      <div>Tab: ${window.S?.tab}</div>
      <div>Manifest Count: ${manifest.length}</div>
      <div>In Manifest: ${manifest.some(m=>m.id===active)}</div>
      <div>Reload Token: ${localStorage.getItem('preview_reload')}</div>
    `;
  }

  setInterval(render, 1000);
})();
