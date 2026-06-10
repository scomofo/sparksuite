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
  if(a === "practiceStartItem" && window.runSparkActionFamilies && window.runSparkActionFamilies(a, v)) return;
  // Delegate to active instrument's handler first
  var _inst = SparkInstruments.getActive();
  if (_inst && _inst.act && _inst.act(a, v)) return;
  if(window.runSparkActionFamilies && window.runSparkActionFamilies(a, v)) return;
};
