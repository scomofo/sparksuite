(function(){
  const el = document.getElementById('overlay');
  Object.assign(el.style,{
    position:'fixed',top:'0',left:'0',background:'#111',color:'#0f0',padding:'10px',zIndex:9999,maxWidth:'400px',fontSize:'12px'
  });

  async function render(){
    try{
      const r = await fetch('.preview_validation.json?ts='+Date.now());
      const j = await r.json();

      el.innerHTML = `
        <div><b>VALIDATION</b></div>
        <div>Status: ${j.ok ? '✅ OK' : '❌ FAIL'}</div>
        <div>Updated: ${new Date(j.updatedAt).toLocaleTimeString()}</div>
        <pre style="white-space:pre-wrap;max-height:200px;overflow:auto">${j.output||''}</pre>
      `;
    }catch(e){
      el.innerHTML = '<div>Waiting for validation...</div>';
    }
  }

  setInterval(render,1000);
})();
