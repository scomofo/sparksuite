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
  var h = '<div class="card mb16">';
  h += '<div><b>'+escHTML(cat.title)+'</b></div>';
  if(cat.id === "display"){
    h += '<div style="margin-top:8px">Theme: ';
    var themes = ["dark","light","blue","highcontrast","retro"];
    for(var i=0;i<themes.length;i++){
      var sel = (S.settings && S.settings.theme) === themes[i];
      h += '<button onclick="act(\'setTheme\',\''+themes[i]+'\')" style="margin:2px;opacity:'+(sel?1:0.5)+'">'+escHTML(themes[i])+'</button>';
    }
    h += '</div>';
  }
  if(cat.id === "audio"){
    h += '<div style="margin-top:8px">UI Volume: '+(S.settings && S.settings.uiVolume !== undefined ? S.settings.uiVolume : 0.5)+'</div>';
  }
  if(cat.id === "practice"){
    h += '<div style="margin-top:8px">Practice Reminder: '+((S.settings && S.settings.practiceReminder) ? "On" : "Off")+'</div>';
  }
  if(cat.id === "about"){
    h += '<div style="margin-top:8px">Version: '+escHTML((S.releaseInfo && S.releaseInfo.version) || "dev")+'</div>';
    h += '<div>Build: '+((S.releaseInfo && S.releaseInfo.build) || 0)+'</div>';
  }
  if(cat.id === "general"){
    h += '<div style="margin-top:8px"><button onclick="act(\'openOnboarding\')">Rerun Setup</button></div>';
  }
  h += '</div>';
  return h;
}
