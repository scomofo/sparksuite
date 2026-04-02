// ===== ChordSpark: Tool and info tabs =====

// ===== TUNER TAB =====
function tunerTab(){
  var h='<div class="card"><div class="text-center"><h3 style="font-size:20px;font-weight:800;color:var(--text-primary);margin:0 0 8px">&#127925; Guitar Tuner</h3><p style="color:var(--text-dim);font-size:13px;margin-bottom:16px">Standard tuning: E A D G B e</p>';
  h+='<div id="tuner-strings" style="display:flex;justify-content:center;gap:8px;margin-bottom:20px;flex-wrap:wrap">';
  for(var i=0;i<GUITAR_STRINGS.length;i++){
    var gs=GUITAR_STRINGS[i],mt=S.tunerNote===gs.note,inT=mt&&Math.abs(S.tunerCents)<5,tC=inT?"#4ECDC4":mt&&Math.abs(S.tunerCents)<15?"#FFE66D":"#FF6B6B";
    h+='<div style="background:'+(mt?tC+"22":"var(--chip-bg)")+';border:2px solid '+(mt?tC:"var(--border)")+';border-radius:12px;padding:8px 14px;text-align:center;min-width:44px"><div style="font-size:18px;font-weight:800;color:'+(mt?tC:"var(--text-muted)")+'">'+gs.note+'</div><div style="font-size:9px;color:var(--text-muted)">'+gs.freq+'Hz</div></div>';
  }
  h+='</div>';
  if(S.tunerActive){
    var inT=Math.abs(S.tunerCents)<5,tC=inT?"#4ECDC4":Math.abs(S.tunerCents)<15?"#FFE66D":"#FF6B6B";
    h+='<div id="tuner-note-display" style="font-size:72px;font-weight:900;color:'+tC+';line-height:1">'+(S.tunerNote||"&#8212;")+'</div><div id="tuner-freq-display" style="font-size:16px;color:var(--text-muted);margin:4px 0 16px">'+(S.tunerFreq>0?S.tunerFreq+" Hz":"Play a note...")+'</div>';
    h+='<div style="position:relative;height:40px;background:var(--input-bg);border-radius:20px;margin:0 auto 16px;max-width:300px;overflow:hidden"><div style="position:absolute;left:50%;top:0;bottom:0;width:3px;background:var(--text-primary);z-index:2"></div><div id="tuner-needle" style="position:absolute;left:'+(50+S.tunerCents/2)+'%;top:4px;bottom:4px;width:12px;border-radius:6px;background:'+tC+';transition:left .15s;transform:translateX(-50%);z-index:3"></div><div style="position:absolute;top:50%;left:16px;transform:translateY(-50%);font-size:11px;color:var(--text-muted)">&#9837; flat</div><div style="position:absolute;top:50%;right:16px;transform:translateY(-50%);font-size:11px;color:var(--text-muted)">sharp &#9839;</div></div>';
    h+='<div id="tuner-status" style="font-size:14px;font-weight:700;color:'+tC+';margin-bottom:16px">';
    if(!S.tunerFreq)h+="&#128266; Listening...";
    else if(inT)h+="&#9989; In Tune!";
    else if(S.tunerCents>0)h+="&#11015; Too sharp (+"+S.tunerCents+"&#162;) &#8595;";
    else h+="&#11014; Too flat ("+S.tunerCents+"&#162;) &#8593;";
    h+='</div><button class="btn" onclick="act(\'stopTuner\')" style="background:#FF6B6B;color:#fff">Stop Tuner</button>';
  } else {
    h+='<div style="font-size:64px;margin-bottom:12px;opacity:.3">&#127908;</div>';
    if(S.tunerErr)h+='<p style="color:#FF6B6B;font-size:13px;margin-bottom:12px">'+S.tunerErr+'</p>';
    h+='<button class="btn" onclick="act(\'startTuner\')" style="background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:#fff">&#127908; Start Tuner</button>';
  }
  h+='</div></div>';
  // Audio Input Device
  h+='<div class="card mb16" style="text-align:left"><h3 style="margin:0 0 12px;font-size:16px;font-weight:800;color:var(--text-primary)">&#127911; Audio Input</h3>';
  h+='<p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;line-height:1.5">Select your audio input device for the Tuner and Chord Check. Use this to pick your USB guitar cable instead of the default microphone.</p>';
  h+='<button onclick="act(\'refreshAudioInputs\')" class="btn" style="margin-bottom:12px;padding:8px 16px;font-size:13px;font-weight:700;background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:#fff;border:none;border-radius:10px">&#128260; Refresh Devices</button>';
  if(S.audioInputDevices.length>0){
    h+='<div style="display:flex;flex-direction:column;gap:8px">';
    for(var ai=0;ai<S.audioInputDevices.length;ai++){
      var ad=S.audioInputDevices[ai],isAI=S.audioInputId===ad.id,isTesting=S.audioTestingId===ad.id;
      h+='<div style="border-radius:10px;border:2px solid '+(isAI?"#4ECDC4":"var(--border)")+';background:'+(isAI?"#4ECDC422":"var(--input-bg)")+';overflow:hidden">';
      h+='<div style="display:flex;align-items:center;gap:8px;padding:10px 14px">';
      h+='<button onclick="act(\'selectAudioInput\',\''+ad.id+'\')" style="flex:1;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:'+(isAI?"#4ECDC4":"var(--text-primary)")+';background:none;border:none;text-align:left;padding:0;cursor:pointer">'+(isAI?"&#9654; ":"&#9675; ")+escHTML(ad.name)+'</button>';
      if(isTesting){
        h+='<button onclick="act(\'stopAudioTest\')" style="padding:4px 10px;border-radius:8px;font-size:11px;font-weight:700;background:#FF6B6B;color:#fff;border:none;cursor:pointer">Stop</button>';
      } else {
        h+='<button onclick="act(\'testAudioInput\',\''+ad.id+'\')" style="padding:4px 10px;border-radius:8px;font-size:11px;font-weight:700;background:var(--chip-bg);color:var(--text-muted);border:1px solid var(--border);cursor:pointer">Test</button>';
      }
      h+='</div>';
      if(isTesting){
        h+='<div style="padding:0 14px 10px">';
        h+='<div style="background:var(--prog-bg);border-radius:6px;height:8px;overflow:hidden;margin-bottom:6px"><div id="audio-test-meter" style="height:100%;width:'+S.audioTestLevel+'%;background:'+(S.audioTestLevel>10?"#4ECDC4":"var(--text-muted)")+';border-radius:6px;transition:width .1s"></div></div>';
        h+='<div id="audio-test-label" style="font-size:11px;font-weight:600;color:'+(S.audioTestLevel>10?"#4ECDC4":"var(--text-muted)")+'">'+( S.audioTestLevel>10?"Signal detected — strum to confirm":"Listening — strum your guitar...")+'</div>';
        h+='</div>';
      }
      h+='</div>';
    }
    h+='</div>';
    if(S.audioInputId){
      h+='<button onclick="act(\'selectAudioInput\',\'\')" style="margin-top:8px;padding:6px 14px;border-radius:8px;font-size:12px;font-weight:600;background:var(--input-bg);color:var(--text-muted);border:1px solid var(--border)">Reset to Default</button>';
    }
  } else {
    h+='<div style="font-size:12px;color:var(--text-muted);padding:10px;background:var(--input-bg);border-radius:10px;text-align:center">Click Refresh to scan for audio input devices.</div>';
  }
  h+='</div>';
  return h;
}

// ===== STATS TAB =====
function statsTab(){
  var h='<div class="text-center mb16"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">&#128202; Practice Stats</h2></div>';
  var hist=S.history||[];

  // Summary cards
  var totalXP=0,totalSessions=0,practiceDays={};
  for(var i=0;i<hist.length;i++){
    totalXP+=hist[i].xp||0;
    totalSessions++;
    practiceDays[hist[i].date]=true;
  }
  var dayCount=Object.keys(practiceDays).length;
  var avgXP=dayCount>0?Math.round(totalXP/dayCount):0;

  h+='<div style="text-align:center;margin-bottom:12px"><button class="btn" onclick="act(\'openSkillTree\')" style="background:var(--accent);color:#fff">&#127795; Skill Tree</button></div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">';
  h+='<div class="stat-card"><div style="font-size:28px;font-weight:900;color:#FF6B6B">'+S.xp+'</div><div style="font-size:11px;color:var(--text-muted);font-weight:600">Total XP</div></div>';
  h+='<div class="stat-card"><div style="font-size:28px;font-weight:900;color:#4ECDC4">'+totalSessions+'</div><div style="font-size:11px;color:var(--text-muted);font-weight:600">Activities</div></div>';
  h+='<div class="stat-card"><div style="font-size:28px;font-weight:900;color:#45B7D1">'+dayCount+'</div><div style="font-size:11px;color:var(--text-muted);font-weight:600">Practice Days</div></div>';
  h+='<div class="stat-card"><div style="font-size:28px;font-weight:900;color:#FFE66D">'+avgXP+'</div><div style="font-size:11px;color:var(--text-muted);font-weight:600">Avg XP/Day</div></div>';
  h+='</div>';

  // Mastery tiers summary
  var tiers={gold:0,silver:0,bronze:0};
  for(var i=0;i<ALL_CHORDS.length;i++){var ct=getChordTier(ALL_CHORDS[i].name);if(ct.tier!=="none")tiers[ct.tier]++;}
  if(tiers.gold+tiers.silver+tiers.bronze>0){
    h+='<div class="card mb16"><h3 style="margin:0 0 12px;font-size:15px;font-weight:800;color:var(--text-primary)">&#127942; Mastery Tiers</h3>';
    h+='<div style="display:flex;justify-content:space-around;text-align:center">';
    h+='<div><div style="font-size:24px">&#129351;</div><div style="font-size:20px;font-weight:900;color:#FFD700">'+tiers.gold+'</div><div style="font-size:10px;color:var(--text-muted)">Gold</div></div>';
    h+='<div><div style="font-size:24px">&#129352;</div><div style="font-size:20px;font-weight:900;color:#C0C0C0">'+tiers.silver+'</div><div style="font-size:10px;color:var(--text-muted)">Silver</div></div>';
    h+='<div><div style="font-size:24px">&#129353;</div><div style="font-size:20px;font-weight:900;color:#CD7F32">'+tiers.bronze+'</div><div style="font-size:10px;color:var(--text-muted)">Bronze</div></div>';
    h+='</div></div>';
  }

  // Activity calendar (last 30 days)
  h+='<div class="card mb16"><h3 style="margin:0 0 12px;font-size:15px;font-weight:800;color:var(--text-primary)">&#128197; Last 30 Days</h3>';
  h+='<div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center">';
  var today=new Date();
  for(var d=29;d>=0;d--){
    var dt=new Date(today);dt.setDate(dt.getDate()-d);
    var ds=dt.toISOString().split("T")[0];
    var active=!!practiceDays[ds];
    var isToday=d===0;
    h+='<div class="cal-dot" title="'+ds+'" style="background:'+(active?"#4ECDC4":isToday?"var(--border)":"var(--input-bg)")+';border:'+(isToday?"2px solid var(--text-muted)":"2px solid transparent")+'" aria-label="'+ds+(active?" - practiced":"")+'"></div>';
  }
  h+='</div></div>';

  // XP last 7 days bar chart
  h+='<div class="card mb16"><h3 style="margin:0 0 12px;font-size:15px;font-weight:800;color:var(--text-primary)">&#9889; XP This Week</h3>';
  var dayNames=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var weekXP=[];var maxXP=1;
  for(var d=6;d>=0;d--){
    var dt=new Date(today);dt.setDate(dt.getDate()-d);
    var ds=dt.toISOString().split("T")[0];
    var dayXP=0;
    for(var i=0;i<hist.length;i++)if(hist[i].date===ds)dayXP+=hist[i].xp||0;
    weekXP.push({day:dayNames[dt.getDay()],xp:dayXP,date:ds});
    if(dayXP>maxXP)maxXP=dayXP;
  }
  h+='<div style="display:flex;align-items:flex-end;justify-content:space-around;height:100px;padding:0 8px">';
  for(var i=0;i<weekXP.length;i++){
    var pct=Math.round((weekXP[i].xp/maxXP)*80);
    var isToday=i===6;
    h+='<div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:4px">';
    h+='<div style="font-size:10px;font-weight:700;color:var(--text-muted)">'+weekXP[i].xp+'</div>';
    h+='<div class="bar-segment" style="width:70%;height:'+Math.max(pct,3)+'%;background:'+(isToday?"#FF6B6B":"#4ECDC4")+'"></div>';
    h+='<div style="font-size:10px;font-weight:600;color:'+(isToday?"#FF6B6B":"var(--text-muted)")+'">'+weekXP[i].day+'</div>';
    h+='</div>';
  }
  h+='</div></div>';

  // Transition difficulty
  var ts=S.transitionStats;
  var transitions=[];
  for(var k in ts)if(ts[k].attempts>=2)transitions.push({key:k,avg:ts[k].avgTime,best:ts[k].best,attempts:ts[k].attempts});
  transitions.sort(function(a,b){return b.avg-a.avg;});
  if(transitions.length>0){
    h+='<div class="card mb16"><h3 style="margin:0 0 12px;font-size:15px;font-weight:800;color:var(--text-primary)">&#128260; Chord Transitions</h3>';
    for(var i=0;i<Math.min(transitions.length,5);i++){
      var t=transitions[i],parts=t.key.split("->");
      var clr=t.avg<2?"#4ECDC4":t.avg<3?"#FFE66D":"#FF6B6B";
      h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="min-width:120px;font-size:12px;font-weight:700;color:var(--text-primary)">'+parts[0]+' &#8594; '+parts[1]+'</div>';
      h+='<div style="flex:1;background:var(--prog-bg);border-radius:6px;height:8px;overflow:hidden"><div style="width:'+Math.min(100,t.avg*33)+'%;height:100%;background:'+clr+';border-radius:6px"></div></div>';
      h+='<div style="font-size:11px;font-weight:700;color:'+clr+';min-width:40px;text-align:right">'+t.avg.toFixed(1)+'s</div></div>';
    }
    h+='</div>';
  }

  // Most practiced chords
  h+='<div class="card mb16"><h3 style="margin:0 0 12px;font-size:15px;font-weight:800;color:var(--text-primary)">&#127928; Most Practiced</h3>';
  var chordCounts={};
  for(var i=0;i<hist.length;i++){
    if(hist[i].type==="session"||hist[i].type==="quiz"){
      var d=hist[i].detail;
      chordCounts[d]=(chordCounts[d]||0)+1;
    }
  }
  var sorted=[];
  for(var k in chordCounts)sorted.push({name:k,count:chordCounts[k]});
  sorted.sort(function(a,b){return b.count-a.count;});
  if(sorted.length===0){
    h+='<p style="font-size:13px;color:var(--text-muted)">No practice data yet. Start a session!</p>';
  } else {
    var topMax=sorted[0].count;
    for(var i=0;i<Math.min(sorted.length,5);i++){
      var pct=Math.round((sorted[i].count/topMax)*100);
      h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><div style="min-width:90px;font-size:13px;font-weight:700;color:var(--text-primary)">'+sorted[i].name+tierBadgeHTML(sorted[i].name,14)+'</div><div style="flex:1;background:var(--prog-bg);border-radius:6px;height:8px;overflow:hidden"><div style="width:'+pct+'%;height:100%;background:linear-gradient(90deg,#FF6B6B,#4ECDC4);border-radius:6px"></div></div><div style="font-size:12px;font-weight:700;color:var(--text-muted);min-width:24px;text-align:right">'+sorted[i].count+'</div></div>';
    }
  }
  h+='</div>';

  // Quiz accuracy
  if(S.quizCorrect>0||S.quizTotal>0){
    var qTotal=0,qCorrect=0;
    for(var i=0;i<hist.length;i++)if(hist[i].type==="quiz"){qTotal++;qCorrect++;}
    var acc=qTotal>0?Math.round((qCorrect/qTotal)*100):0;
    h+='<div class="card mb16"><h3 style="margin:0 0 12px;font-size:15px;font-weight:800;color:var(--text-primary)">&#129504; Quiz Accuracy</h3>';
    h+='<div class="flex-center">'+ringHTML(acc,80,6,"#4ECDC4",'<div style="font-size:20px;font-weight:900;color:var(--text-primary)">'+acc+'%</div>',"Quiz accuracy")+'</div>';
    h+='<div style="text-align:center;font-size:12px;color:var(--text-muted);margin-top:8px">'+S.quizCorrect+' correct answers</div></div>';
  }

  // Cross-app progress (reads PianoSpark export from localStorage)
  h+=crossAppProgressCard();

  return h;
}

function crossAppProgressCard(){
  var h='';
  try{
    var raw=localStorage.getItem("pianospark_jeeves_export");
    if(!raw)return '';
    var ps=JSON.parse(raw);
    h+='<div class="card mb16" style="border:1px solid #45B7D1"><h3 style="margin:0 0 12px;font-size:15px;font-weight:800;color:#45B7D1">&#127929; My Music Journey</h3>';
    h+='<div style="display:flex;gap:12px;margin-bottom:12px">';
    // Guitar stats
    h+='<div style="flex:1;background:var(--input-bg);border-radius:12px;padding:12px;text-align:center">';
    h+='<div style="font-size:20px;margin-bottom:4px">&#127930;</div>';
    h+='<div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:6px">Guitar</div>';
    h+='<div style="font-size:22px;font-weight:900;color:#FF6B6B">'+S.xp+'</div><div style="font-size:10px;color:var(--text-muted)">XP</div>';
    h+='<div style="font-size:16px;font-weight:800;color:#4ECDC4;margin-top:4px">Lvl '+S.level+'</div>';
    h+='</div>';
    // Piano stats
    h+='<div style="flex:1;background:var(--input-bg);border-radius:12px;padding:12px;text-align:center">';
    h+='<div style="font-size:20px;margin-bottom:4px">&#127929;</div>';
    h+='<div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:6px">Piano</div>';
    h+='<div style="font-size:22px;font-weight:900;color:#FF6B6B">'+(ps.xp||0)+'</div><div style="font-size:10px;color:var(--text-muted)">XP</div>';
    h+='<div style="font-size:16px;font-weight:800;color:#4ECDC4;margin-top:4px">Lvl '+(ps.level||1)+'</div>';
    h+='</div>';
    h+='</div>';
    // Combined stats
    var totalXP=(S.xp||0)+(ps.xp||0);
    var totalSessions=(S.sessions||0)+(ps.sessions||0);
    var combinedStreak=Math.max(S.streak||0,ps.streak||0);
    h+='<div style="display:flex;justify-content:space-around;text-align:center">';
    h+='<div><div style="font-size:20px;font-weight:900;color:#FFE66D">'+totalXP+'</div><div style="font-size:10px;color:var(--text-muted)">Combined XP</div></div>';
    h+='<div><div style="font-size:20px;font-weight:900;color:#4ECDC4">'+totalSessions+'</div><div style="font-size:10px;color:var(--text-muted)">Total Sessions</div></div>';
    h+='<div><div style="font-size:20px;font-weight:900;color:#FF6B6B">&#128293;'+combinedStreak+'</div><div style="font-size:10px;color:var(--text-muted)">Best Streak</div></div>';
    h+='</div></div>';
  }catch(e){}
  return h;
}

// ===== GUIDE TAB =====
function guideTab(){
  var h='<div class="text-center mb16"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">&#128214; How to Read Chord Charts</h2></div>';
  h+='<div class="card mb16"><div class="flex-center mb12">'+chordSVG(CHORDS[1][0],200)+'</div><div style="text-align:center;font-size:13px;color:var(--text-dim);font-weight:600">Example: E Major</div></div>';
  h+='<div class="card mb16" style="text-align:left"><h3 style="margin:0 0 12px;font-size:16px;font-weight:800;color:var(--text-primary)">&#127912; Chart Legend</h3>';
  h+='<div style="display:flex;flex-direction:column;gap:12px">';
  h+='<div style="display:flex;align-items:flex-start;gap:12px"><div style="min-width:36px;height:36px;border-radius:10px;background:var(--input-bg);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:var(--text-muted)">|</div><div><div style="font-weight:700;color:var(--text-primary);font-size:14px">Vertical Lines = Strings</div><div style="font-size:12px;color:var(--text-dim);line-height:1.5">6 strings from left to right: E A D G B e (thickest to thinnest)</div></div></div>';
  h+='<div style="display:flex;align-items:flex-start;gap:12px"><div style="min-width:36px;height:36px;border-radius:10px;background:var(--input-bg);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:var(--text-muted)">&mdash;</div><div><div style="font-weight:700;color:var(--text-primary);font-size:14px">Horizontal Lines = Frets</div><div style="font-size:12px;color:var(--text-dim);line-height:1.5">The thick bar at the top is the nut. Lines below are frets going down the neck.</div></div></div>';
  h+='<div style="display:flex;align-items:flex-start;gap:12px"><div style="min-width:36px;height:36px;border-radius:10px;background:#FF6B6B;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff">1</div><div><div style="font-weight:700;color:var(--text-primary);font-size:14px">Colored Dots = Finger Placement</div><div style="font-size:12px;color:var(--text-dim);line-height:1.5">Place your finger between the frets where the dot appears. The number tells you which finger to use.</div></div></div>';
  h+='<div style="display:flex;align-items:flex-start;gap:12px"><div style="min-width:36px;height:36px;border-radius:10px;background:var(--input-bg);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#FF6B6B">X</div><div><div style="font-weight:700;color:var(--text-primary);font-size:14px">X = Don\'t Play</div><div style="font-size:12px;color:var(--text-dim);line-height:1.5">This string should be muted or not strummed.</div></div></div>';
  h+='<div style="display:flex;align-items:flex-start;gap:12px"><div style="min-width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center"><svg width="24" height="24"><circle cx="12" cy="12" r="8" fill="none" stroke="#4ECDC4" stroke-width="2.5"/></svg></div><div><div style="font-weight:700;color:var(--text-primary);font-size:14px">O = Play Open</div><div style="font-size:12px;color:var(--text-dim);line-height:1.5">Strum this string without pressing any fret.</div></div></div>';
  h+='</div></div>';
  h+='<div class="card mb16" style="text-align:left"><h3 style="margin:0 0 12px;font-size:16px;font-weight:800;color:var(--text-primary)">&#9995; Finger Numbers</h3>';
  h+='<div style="display:flex;justify-content:space-around;text-align:center">';
  h+='<div><div style="width:40px;height:40px;border-radius:50%;background:#FF6B6B;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#fff;margin:0 auto 4px">1</div><div style="font-size:11px;color:var(--text-label);font-weight:600">Index</div></div>';
  h+='<div><div style="width:40px;height:40px;border-radius:50%;background:#4ECDC4;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#fff;margin:0 auto 4px">2</div><div style="font-size:11px;color:var(--text-label);font-weight:600">Middle</div></div>';
  h+='<div><div style="width:40px;height:40px;border-radius:50%;background:#45B7D1;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#fff;margin:0 auto 4px">3</div><div style="font-size:11px;color:var(--text-label);font-weight:600">Ring</div></div>';
  h+='<div><div style="width:40px;height:40px;border-radius:50%;background:#FFE66D;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:var(--text-primary);margin:0 auto 4px">4</div><div style="font-size:11px;color:var(--text-label);font-weight:600">Pinky</div></div>';
  h+='</div><p style="font-size:12px;color:var(--text-muted);margin-top:12px;text-align:center">Thumb stays behind the neck - it\'s never numbered on the chart.</p></div>';
  h+='<div class="card mb16" style="text-align:left"><h3 style="margin:0 0 12px;font-size:16px;font-weight:800;color:var(--text-primary)">&#127919; How to Practice</h3>';
  h+='<div style="display:flex;flex-direction:column;gap:10px;font-size:13px;color:var(--text-secondary);line-height:1.6">';
  h+='<div><span style="font-weight:700;color:#FF6B6B">1.</span> Pick a chord from the <strong>Practice</strong> tab and start a session.</div>';
  h+='<div><span style="font-weight:700;color:#FF6B6B">2.</span> Place your fingers exactly as shown in the chart.</div>';
  h+='<div><span style="font-weight:700;color:#FF6B6B">3.</span> Strum each string one at a time to check for buzzing.</div>';
  h+='<div><span style="font-weight:700;color:#FF6B6B">4.</span> Use the <strong>Metronome</strong> to keep time while you practice.</div>';
  h+='<div><span style="font-weight:700;color:#FF6B6B">5.</span> Use <strong>Chord Check</strong> to hear if your chord sounds right.</div>';
  h+='<div><span style="font-weight:700;color:#FF6B6B">6.</span> Try <strong>Drills</strong> to practice switching between chords quickly.</div>';
  h+='</div></div>';
  h+='<div class="card mb16" style="text-align:left"><h3 style="margin:0 0 12px;font-size:16px;font-weight:800;color:var(--text-primary)">&#128640; App Features</h3>';
  h+='<div style="display:flex;flex-direction:column;gap:10px">';
  var feats=[
    ["\uD83C\uDFB6","Practice","Timed sessions with chord diagrams, metronome, and mic feedback"],
    ["\u26A1","Drills","60-second speed drills switching between two chords"],
    ["\uD83C\uDFC5","Daily","A new challenge every day for bonus XP"],
    ["\uD83E\uDDE0","Quiz","Identify chords by their diagram to test your knowledge"],
    ["\uD83D\uDC42","Ear Training","Listen to a chord and identify it by ear"],
    ["\uD83C\uDFBC","Strum","Learn common strumming patterns with visual timing"],
    ["\uD83C\uDFB5","Songs","Play along with real songs using chord progressions"],
    ["\uD83E\uDD41","Rhythm","Tap-based rhythm game to improve your timing"],
    ["\uD83D\uDD27","Build","Create and play custom chord progressions"],
    ["\uD83C\uDFA4","Tuner","Tune your guitar with the built-in mic tuner"],
    ["\uD83D\uDCCA","Stats","Track your practice history and view analytics"]];
  for(var i=0;i<feats.length;i++)
    h+='<div style="display:flex;align-items:flex-start;gap:10px"><div style="font-size:18px;min-width:28px;text-align:center">'+feats[i][0]+'</div><div><div style="font-weight:700;color:var(--text-primary);font-size:13px">'+feats[i][1]+'</div><div style="font-size:12px;color:var(--text-dim)">'+feats[i][2]+'</div></div></div>';
  h+='</div></div>';
  h+='<div class="card mb16" style="text-align:left"><h3 style="margin:0 0 10px;font-size:16px;font-weight:800;color:var(--text-primary)">&#11088; Leveling Up</h3>';
  h+='<p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin:0">Master all chords at your current level to unlock the next. Each practice session builds your mastery percentage. Complete sessions, drills, and challenges to earn <strong>XP</strong> and <strong>badges</strong>. Keep a daily streak going for bonus rewards!</p></div>';
  // Focus Mode
  h+='<div class="card mb16" style="text-align:left"><h3 style="margin:0 0 8px;font-size:16px;font-weight:800;color:var(--text-primary)">&#128065; Focus Mode</h3>';
  h+='<p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;line-height:1.5">Simplify the interface &mdash; show only core practice tabs to reduce distractions.</p>';
  h+='<div style="display:flex;align-items:center;justify-content:space-between"><span style="font-size:13px;font-weight:700;color:var(--text-primary)">Focus Mode</span>';
  h+='<button onclick="act(\'toggleFocus\')" style="padding:8px 20px;border-radius:10px;font-size:13px;font-weight:700;background:'+(S.focusMode?"#4ECDC4":"var(--input-bg)")+';color:'+(S.focusMode?"#fff":"var(--text-muted)")+';border:2px solid '+(S.focusMode?"#4ECDC4":"var(--border)")+';transition:all .2s">'+(S.focusMode?"&#9989; On":"Off")+'</button></div></div>';
  // MIDI Output
  h+='<div class="card mb16" style="text-align:left"><h3 style="margin:0 0 12px;font-size:16px;font-weight:800;color:var(--text-primary)">&#127929; MIDI Output</h3>';
  h+='<p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;line-height:1.5">Send chord notes to your DAW or virtual instrument via Web MIDI. Connect a MIDI device, enable below, then play any chord.</p>';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><span style="font-size:13px;font-weight:700;color:var(--text-primary)">Enable MIDI</span>';
  h+='<button onclick="act(\'toggleMidi\')" style="padding:8px 20px;border-radius:10px;font-size:13px;font-weight:700;background:'+(S.midiEnabled?"#4ECDC4":"var(--input-bg)")+';color:'+(S.midiEnabled?"#fff":"var(--text-muted)")+';border:2px solid '+(S.midiEnabled?"#4ECDC4":"var(--border)")+';transition:all .2s">'+(S.midiEnabled?"&#9989; On":"Off")+'</button></div>';
  if(S.midiEnabled){
    h+='<div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:6px">MIDI Devices:</div>';
    if(S.midiDevices.length===0){
      h+='<div style="font-size:12px;color:var(--text-muted);padding:10px;background:var(--input-bg);border-radius:10px;text-align:center">No MIDI output devices found. Connect a device and reload.</div>';
    } else {
      h+='<div style="display:flex;flex-direction:column;gap:6px">';
      for(var i=0;i<S.midiDevices.length;i++){
        var md=S.midiDevices[i],isActive=S.midiOutput&&S.midiOutputId===md.id;
        h+='<button onclick="act(\'selectMidiDevice\',\''+md.id+'\')" style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;font-size:13px;font-weight:600;background:'+(isActive?"#4ECDC422":"var(--input-bg)")+';color:'+(isActive?"#4ECDC4":"var(--text-primary)")+';border:2px solid '+(isActive?"#4ECDC4":"var(--border)")+';text-align:left">'+(isActive?"&#9654; ":"&#9675; ")+escHTML(md.name)+'</button>';
      }
      h+='</div>';
    }
  }
  h+='</div>';

  h+='<div style="text-align:center;margin-top:16px;font-size:12px;color:var(--text-muted)">Press <strong>?</strong> for keyboard shortcuts</div>';
  return h;
}
