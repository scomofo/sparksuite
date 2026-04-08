(function(){
  const root=document.getElementById('overlay')||document.body.appendChild(document.createElement('div'));
  root.id='overlay';

  const state={filter:'',type:'all'};

  function controls(){
    const c=document.createElement('div');

    const input=document.createElement('input');
    input.placeholder='filter';
    input.oninput=()=>{state.filter=input.value;render();};

    const select=document.createElement('select');
    ['all','missing_exercise','missing_skill','duplicate_lesson'].forEach(t=>{
      const o=document.createElement('option');o.value=t;o.textContent=t;select.appendChild(o);
    });
    select.onchange=()=>{state.type=select.value;render();};

    c.append(input,select);
    return c;
  }

  async function render(){
    root.innerHTML='';
    root.appendChild(controls());

    try{
      const r=await fetch('.preview_validation.json?ts='+Date.now());
      const j=await r.json();

      const issues=window.SparkParseValidationIssues(j.output||'');

      issues
        .filter(i=>state.type==='all'||i.type===state.type)
        .filter(i=>!state.filter||i.label.includes(state.filter))
        .forEach(i=>{
          const div=document.createElement('div');
          div.textContent=i.label;
          div.style.cursor='pointer';
          div.onclick=()=>window.SparkDevNavigateTo(i.keyword);
          root.appendChild(div);
        });

    }catch{
      root.innerHTML+='Waiting...';
    }
  }

  setInterval(render,1000);
})();
