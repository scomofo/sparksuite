(function(){
  if (!window.location.search.includes('dev=1')) return;

  let lastToken = null;

  async function checkReload(){
    try {
      const res = await fetch('.preview_reload?ts=' + Date.now());
      const text = await res.text();

      if (lastToken === null) {
        lastToken = text;
        return;
      }

      if (text !== lastToken) {
        console.log('[DEV] Reload detected');
        location.reload();
      }
    } catch(e) {
      // ignore (likely file:// mode)
    }
  }

  setInterval(checkReload, 1000);
})();
