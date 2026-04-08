(function(){
  const state={dock:localStorage.getItem('spark_dev_overlay_dock')||'right',collapsed:localStorage.getItem('spark_dev_overlay_collapsed')==='true',filter:localStorage.getItem('spark_dev_overlay_filter')||''};
  let root=document.getElementById('overlay')||document.body.appendChild(document.createElement('div'));
  root.id='overlay';

  function pos(){
    Object.assign(root.style,{position:'fixed',top:'0',bottom:'0',width:state.collapsed?'40px':'300px',background:'#111',color:'#0f0',overflow:'auto',zIndex:9999});
    if(state.dock==='right'){root.style.right='0';root.style.left='';}else{root.style.left='0';root.style.right='';}
  }

  function controls(){
    const c=document.createElement('div');
    const d=document.createElement('button');d.textContent='Dock';d.onclick=()=>{state.dock=state.dock==='right'?'left':'right';localStorage.setItem('spark_dev_overlay_dock',state.dock);pos();};
    const col=document.createElement('button');col.textContent=state.collapsed?'Expand':'Collapse';col.onclick=()=>{state.collapsed=!state.collapsed;localStorage.setItem('spark_dev_overlay_collapsed',state.collapsed);render();};
    const f=document.createElement('input');f.value=state.filter;f.oninput=()=>{state.filter=f.value;localStorage.setItem('spark_dev_overlay_filter',state.filter);render();};
    c.append(d,col,f);return c;
  }

  async function render(){
    pos();root.innerHTML='';
    if(state.collapsed){root.textContent='⚡';return;}
    root.appendChild(controls());
    try{
      const r=await fetch('.preview_validation.json?ts='+Date.now());
      const j=await r.json();
      const words=(j.output||'').match(/[a-zA-Z0-9_-]+/g)||[];
      [...new Set(words)].filter(w=>!state.filter||w.includes(state.filter)).slice(0,40).forEach(k=>{
        const b=document.createElement('button');b.textContent=k;b.onclick=()=>window.SparkDevNavigateTo(k);root.appendChild(b);
      });
    }catch{root.innerHTML+='<div>Waiting...</div>';}
  }

  setInterval(render,1000);
})();