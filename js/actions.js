// js/actions.js
// The legacy `window.act(action, value)` dispatcher extracted from
// js/app.js. This is the single entry point that page-rendered
// `onclick="act('foo', 'bar')"` handlers funnel through. It owns
// every interactive transition in the app: instrument switching, tab
// changes, session/drill/daily lifecycle, song picking, performance
// gameplay launches, settings toggles, etc.
//
// Pure relocation — no behavioral changes. The `window.act` global is
// preserved so HTML onclick handlers and the active-instrument
// `_inst.act(a, v)` delegation in instrument modules find it unchanged.
//
// Pre-conditions (load order): this file must load AFTER everything
// it calls — page renderers, performance modules, _sparkEmit and the
// orchestrator-request helpers, the Showroom modules, etc. — and AFTER
// js/state.js (uses S, T). See <script> ordering in index.html.

// ===== ACTION DISPATCHER =====
window.act=function(a,v){
  // Delegate to active instrument's handler first
  var _inst = SparkInstruments.getActive();
  if (_inst && _inst.act && _inst.act(a, v)) return;
  if(window.runSparkActionFamilies && window.runSparkActionFamilies(a, v)) return;
  // Return to the launcher (instrument picker) from anywhere inside an
  // instrument. activeInstrument persists to localStorage, so without a
  // dedicated back-out path the launcher is effectively one-way once a
  // user picks. deactivate() + render() brings them back to the picker.
  if(a==="switchInstrumentBack"){
    if(typeof SparkInstruments!=="undefined"&&SparkInstruments.deactivate){SparkInstruments.deactivate();}
    S.activeInstrument=null;
    if(typeof saveState==="function")saveState();
    render();
    return;
  }
  // Switch instrument from v2 dashboard
  if(a==="switchInstrument" && v){
    SparkInstruments.activate(v);
    S.activeInstrument = v;
    S.screen = SCR.HOME;
    S.tab = TAB.PRACTICE;
    saveState();
    render();
    return;
  }
  if(a==="tab"){
    if(window.SparkProgressBridge&&typeof SparkProgressBridge.applyLegacyActivityRuntime==="function"){
      SparkProgressBridge.applyLegacyActivityRuntime({
        setFields:{tab:v,screen:SCR.HOME,earTrainQ:null,earTrainAns:null,selectedVoicing:0}
      });
    }else{
      S.tab=v;S.screen=SCR.HOME;
      S.earTrainQ=null;S.earTrainAns=null;S.selectedVoicing=0;
    }
    if(window.sparkCore && typeof window.sparkCore.updateRuntimeState === "function"){
      window.sparkCore.updateRuntimeState({
        activeScreen: "home",
        activeTab: v || null,
        transport: { status: "idle", positionMs: 0 }
      });
    }
    stopAllTimers();
    if(v===TAB.SONGS&&S.songsSubTab==="community")fetchCommunity();
    render();return;
  }
};
