(function(){
  async function getValidation(){
    try{
      const r = await fetch('.preview_validation.json?ts='+Date.now());
      return await r.json();
    }catch{
      return null;
    }
  }

  function extractKeywords(output){
    if(!output) return [];
    const matches = output.match(/[a-zA-Z0-9_-]+/g) || [];
    return [...new Set(matches)].slice(0,50);
  }

  function highlight(doc, keywords){
    if(!doc || !keywords.length) return;

    // clear old
    doc.querySelectorAll('[data-dev-highlight]').forEach(el=>{
      el.style.outline='';
      el.removeAttribute('data-dev-highlight');
    });

    const all = doc.querySelectorAll('*');

    keywords.forEach(k=>{
      all.forEach(el=>{
        if(el.children.length) return;
        const text = el.textContent || '';
        if(text.includes(k)){
          el.style.outline='2px solid red';
          el.setAttribute('data-dev-highlight','1');
        }
      });
    });
  }

  async function loop(){
    const iframe = document.querySelector('iframe');
    if(!iframe || !iframe.contentDocument) return;

    const validation = await getValidation();
    if(!validation || validation.ok) return;

    const keys = extractKeywords(validation.output);
    highlight(iframe.contentDocument, keys);
  }

  setInterval(loop,1500);
})();
