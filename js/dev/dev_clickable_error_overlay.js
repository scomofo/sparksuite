(function(){
  const el = document.getElementById('overlay');

  async function render(){
    try{
      const r = await fetch('.preview_validation.json?ts='+Date.now());
      const j = await r.json();

      const words = (j.output || '').match(/[a-zA-Z0-9_-]+/g) || [];
      const unique = [...new Set(words)].slice(0,10);

      el.innerHTML = `
        <div><b>VALIDATION</b></div>
        <div>Status: ${j.ok ? '✅ OK' : '❌ FAIL'}</div>
        <div>Click to navigate:</div>
        <div id="links"></div>
      `;

      const links = el.querySelector('#links');

      unique.forEach(k=>{
        const btn = document.createElement('button');
        btn.textContent = k;
        btn.style.display = 'block';
        btn.style.margin = '2px 0';
        btn.onclick = ()=> window.SparkDevNavigateTo(k);
        links.appendChild(btn);
      });

    }catch{
      el.innerHTML = '<div>Waiting for validation...</div>';
    }
  }

  setInterval(render,1000);
})();
