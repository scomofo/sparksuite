function settingsUiRoot(){
  if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
    return SparkState.getRoot();
  }
  return typeof globalThis !== "undefined" ? (globalThis.__sparkState || null) : null;
}

function settingsUiRead(path, fallback){
  var root = settingsUiRoot();
  var parts = Array.isArray(path) ? path.slice() : [path];
  var cursor = root;
  var i;
  if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
    return SparkState.read(path, fallback);
  }
  if(!cursor) return fallback;
  for(i = 0; i < parts.length; i++){
    if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
    cursor = cursor[parts[i]];
  }
  return cursor == null ? fallback : cursor;
}

function settingsPage(){
  var h = '<div class="card mb16">';
  h += '<div><b>Settings</b></div>';
  h += '</div>';
  var cats = typeof getSettingsCategories === "function" ? getSettingsCategories() : [];
  for(var i=0;i<cats.length;i++){
    h += renderSettingsCategory(cats[i]);
  }
  return h;
}

function renderSettingsCategory(cat){
  var runtimeState = window.sparkCore && typeof window.sparkCore.getRuntimeState === "function"
    ? window.sparkCore.getRuntimeState()
    : null;
  var theme = runtimeState && runtimeState.settingsTheme
    ? runtimeState.settingsTheme
    : settingsUiRead(["settings", "theme"], "dark");
  var h = '<div class="card mb16">';
  h += '<div><b>'+escHTML(cat.title)+'</b></div>';
  if(cat.id === "display"){
    h += '<div style="margin-top:8px">Theme: ';
    var themes = ["dark","light","blue","highcontrast","retro"];
    for(var i=0;i<themes.length;i++){
      var sel = theme === themes[i];
      h += '<button onclick="act(\'setTheme\',\''+themes[i]+'\')" style="margin:2px;opacity:'+(sel?1:0.5)+'">'+escHTML(themes[i])+'</button>';
    }
    h += '</div>';
  }
  if(cat.id === "audio"){
    h += '<div style="margin-top:8px">UI Volume: '+settingsUiRead(["settings", "uiVolume"], 0.5)+'</div>';
  }
  if(cat.id === "practice"){
    h += '<div style="margin-top:8px">Practice Reminder: '+(settingsUiRead(["settings", "practiceReminder"], false) ? "On" : "Off")+'</div>';
  }
  if(cat.id === "about"){
    h += '<div style="margin-top:8px">Version: '+escHTML(settingsUiRead(["releaseInfo", "version"], "dev"))+'</div>';
    h += '<div>Build: '+settingsUiRead(["releaseInfo", "build"], 0)+'</div>';
  }
  if(cat.id === "general"){
    h += '<div style="margin-top:8px"><button onclick="act(\'openOnboarding\')">Rerun Setup</button></div>';
  }
  h += '</div>';
  return h;
}
