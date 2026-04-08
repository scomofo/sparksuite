(function(){
  let lastFocused = null;

  function findBestMatch(doc, keyword){
    const nodes = Array.from(doc.querySelectorAll('*')).filter(el => !el.children.length);

    for (const el of nodes){
      const text = el.textContent || '';
      if (text === keyword) return el;
    }

    for (const el of nodes){
      const text = el.textContent || '';
      if (text.includes(keyword)) return el;
    }

    return null;
  }

  window.SparkDevNavigateTo = function(keyword){
    const iframe = document.querySelector('iframe');
    if (!iframe || !iframe.contentDocument) return;

    const doc = iframe.contentDocument;
    const target = findBestMatch(doc, keyword);

    if (!target) return;

    if (lastFocused){
      lastFocused.style.outline = '';
      lastFocused.style.background = '';
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.style.outline = '3px solid cyan';
    target.style.background = 'rgba(0,255,255,0.2)';

    lastFocused = target;
  };
})();
