(function(){
  function nowSec(){
    return Date.now() / 1000;
  }

  function clamp(v, min, max){
    return Math.max(min, Math.min(max, v));
  }

  window.nowSec = nowSec;
  window.clamp = clamp;
})();
