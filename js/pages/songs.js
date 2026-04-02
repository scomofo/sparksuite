// ===== ChordSpark: Song-related pages and sections =====

// Helper: check if only one stem is on (solo mode)
function _isStemSolo(name){
  var onCount=0,soloName="";
  for(var k in S.stemToggles){if(S.stemToggles[k]){onCount++;soloName=k;}}
  return onCount===1&&soloName===name;
}

// ===== STRUM TAB =====
function strumTab(){
  var h='<div class="text-center mb16"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">Strum Patterns &#127932;</h2></div><div class="flex-col">';
  for(var i=0;i<STRUM_PATTERNS.length;i++){
    var sp=STRUM_PATTERNS[i],lk=sp.level>S.level;
    h+='<div class="card" style="opacity:'+(lk?0.4:1)+';cursor:'+(lk?"default":"pointer")+'"'+(lk?'':clickableDiv("act(\'openStrum\',\'"+sp.name+"\')"))+'">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center"><div><h3 style="margin:0;font-size:16px;font-weight:800;color:var(--text-primary)">'+sp.name+'</h3><p style="margin:4px 0 0;font-size:12px;color:var(--text-dim)">'+sp.desc+'</p></div><div style="text-align:right"><div style="font-size:12px;font-weight:700;color:'+LC[sp.level]+'">Lvl '+sp.level+'</div><div style="font-size:11px;color:var(--text-muted)">'+sp.bpm+' BPM</div></div></div>';
    h+='<div style="display:flex;gap:4px;margin-top:10px">';
    for(var j=0;j<sp.pattern.length;j++){
      var p=sp.pattern[j],isD=p==="D",isU=p==="U";
      h+='<div style="width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:'+(isD?"#FF6B6B22":isU?"#4ECDC422":"var(--chip-bg)")+';font-size:14px;font-weight:700;color:'+(isD?"#FF6B6B":isU?"#4ECDC4":"var(--text-muted)")+'">'+(isD?"\u2193":isU?"\u2191":"\u00B7")+'</div>';
    }
    h+='</div></div>';
  }
  h+='</div>';
  return h;
}

// ===== SONGS TAB =====
function songsTab(){
  var h='<div class="text-center mb16"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">Song Library &#127925;</h2></div>';
  // Sub-tabs: Built-in | Community
  h+='<div class="community-tabs">';
  h+='<button class="community-tab'+(S.songsSubTab==="builtin"?" active":"")+'" onclick="act(\'songsSubTab\',\'builtin\')">&#127925; Built-in</button>';
  h+='<button class="community-tab'+(S.songsSubTab==="community"?" active":"")+'" onclick="act(\'songsSubTab\',\'community\')">&#127760; Community</button>';
  h+='<button class="community-tab'+(S.songsSubTab==="import"?" active":"")+'" onclick="act(\'songsSubTab\',\'import\')">&#128196; Import</button>';
  h+='<button class="community-tab'+(S.songsSubTab==="stems"?" active":"")+'" onclick="act(\'songsSubTab\',\'stems\')">&#127911; Stems</button>';
  h+='<button class="songs-subtab'+(S.songsSubTab==="perform"?" active":"")+'"'+clickableDiv("act(\'songsSubTab\',\'perform\')")+'>&#127918; Perform</button>';
  h+='</div>';

  if(S.songsSubTab==="community") return h+communitySection();
  if(S.songsSubTab==="import") return h+importSection();
  if(S.songsSubTab==="stems") return h+stemsSection();
  if(S.songsSubTab==="perform") return h+performSubTab();

  // Performance Daily Challenge card
  if(S.performanceDailyChallenge){
    h+='<div class="card mb20" style="border:2px solid '+(S.performanceDailyComplete?"#4ECDC4":"#FFE66D")+'">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;gap:12px">';
    h+='<div><h3 style="margin:0;font-size:15px;font-weight:800;color:var(--text-primary)">'+(S.performanceDailyComplete?'&#9989;':'&#127919;')+' Performance Daily</h3>';
    h+='<p style="margin:3px 0 0;font-size:12px;color:var(--text-muted)">'+escHTML(S.performanceDailyChallenge.label)+'</p>';
    h+='<p style="margin:2px 0 0;font-size:11px;color:var(--text-dim)">+'+S.performanceDailyChallenge.xp+' XP</p></div>';
    if(!S.performanceDailyComplete){
      h+='<button class="btn" onclick="act(\'openPerformanceDaily\')" style="background:linear-gradient(135deg,#FFE66D,#FF8A5C);color:#333;font-weight:800">Go</button>';
    }
    h+='</div></div>';
  }

  // Search filter
  h+='<div style="margin-bottom:12px"><input class="set-input" type="text" placeholder="Search by title, artist, or chord..." value="'+escHTML(S.songFilter)+'" oninput="act(\'songFilter\',this.value)" aria-label="Filter songs"/></div>';

  // Sort controls
  var sorts=[["level","Level"],["title","Title"],["artist","Artist"],["bpm","BPM"],["chords","Chords"]];
  h+='<div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">';
  for(var si=0;si<sorts.length;si++){
    var sk=sorts[si][0],sl=sorts[si][1],active=S.songSort===sk;
    var arrow=active?(S.songSortAsc?" &#9650;":" &#9660;"):"";
    h+='<button onclick="act(\'songSort\',\''+sk+'\')" style="padding:5px 12px;border-radius:10px;font-size:11px;font-weight:700;background:'+(active?"#4ECDC4":"var(--input-bg)")+';color:'+(active?"#fff":"var(--text-muted)")+';border:1px solid '+(active?"#4ECDC4":"var(--border)")+'">'+sl+arrow+'</button>';
  }
  h+='</div>';

  // Filter songs
  var filtered=SONGS.slice();
  if(S.songFilter){
    var q=S.songFilter.toLowerCase();
    filtered=filtered.filter(function(s){
      return s.title.toLowerCase().indexOf(q)!==-1||
             s.artist.toLowerCase().indexOf(q)!==-1||
             s.chords.join(" ").toLowerCase().indexOf(q)!==-1;
    });
  }

  // Sort songs
  var sortKey=S.songSort||"level",asc=S.songSortAsc;
  filtered.sort(function(a,b){
    var va,vb;
    if(sortKey==="title"){va=a.title.toLowerCase();vb=b.title.toLowerCase();}
    else if(sortKey==="artist"){va=a.artist.toLowerCase();vb=b.artist.toLowerCase();}
    else if(sortKey==="bpm"){va=a.bpm;vb=b.bpm;}
    else if(sortKey==="chords"){va=a.chords.length;vb=b.chords.length;}
    else{va=a.level;vb=b.level;}
    if(va<vb)return asc?-1:1;
    if(va>vb)return asc?1:-1;
    return 0;
  });

  // Count
  h+='<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">'+filtered.length+' song'+(filtered.length===1?"":"s")+(S.songFilter?" matching &ldquo;"+escHTML(S.songFilter)+"&rdquo;":"")+'</div>';

  h+='<div class="flex-col">';
  for(var i=0;i<filtered.length;i++){
    var s=filtered[i],lk=s.level>S.level;
    h+='<div class="card" style="opacity:'+(lk?0.4:1)+';cursor:'+(lk?"default":"pointer")+'"'+(lk?'':clickableDiv("act(\'openSong\',"+i+")"))+'">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center"><div><h3 style="margin:0;font-size:16px;font-weight:800;color:var(--text-primary)">'+escHTML(s.title)+'</h3><p style="margin:2px 0 0;font-size:12px;color:var(--text-muted)">'+escHTML(s.artist)+'</p></div><div style="text-align:right"><div style="font-size:12px;font-weight:700;color:'+LC[s.level]+'">Lvl '+s.level+'</div><div style="font-size:11px;color:var(--text-muted)">'+s.bpm+' BPM &bull; '+s.chords.length+' chords</div>';
    if(typeof getPerformanceStats==="function"){
      var _ps=getPerformanceStats(s.title.toLowerCase().replace(/[^a-z0-9]+/g,"_")+"_perf","chords",S.performDifficulty);
      if(_ps.mastery!=="none"){
        h+='<div style="font-size:11px;font-weight:700;color:'+getMasteryColor(_ps.mastery)+'">'+getMasteryIcon(_ps.mastery)+' '+_ps.mastery+'</div>';
      }
    }
    h+='</div></div>';
    h+='<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">';
    for(var j=0;j<s.chords.length;j++)
      h+='<span style="background:var(--chip-bg);padding:3px 10px;border-radius:10px;font-size:12px;font-weight:700;color:var(--chip-color)">'+escHTML(s.chords[j])+'</span>';
    h+='</div>';
    if(s.progression&&s.progression.length>0&&!lk){
      h+='<div style="margin-top:6px"><button class="btn btn-sm" onclick="event.stopPropagation();act(\'openPerformSong\','+SONGS.indexOf(s)+')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff;font-size:11px;padding:4px 10px">&#127918; Perform</button></div>';
    }
    h+='</div>';
  }
  if(filtered.length===0)h+='<div class="card text-center"><p style="color:var(--text-muted);font-size:13px">No songs match your search.</p></div>';
  h+='</div>';
  return h;
}

// ===== COMMUNITY SECTION =====
function communitySection(){
  var h='<div class="community-tabs" style="margin-bottom:12px">';
  h+='<button class="community-tab'+(S.communityTab==="browse"?" active":"")+'" onclick="act(\'communityTab\',\'browse\')">Browse</button>';
  h+='<button class="community-tab'+(S.communityTab==="submit"?" active":"")+'" onclick="act(\'communityTab\',\'submit\')">Submit</button>';
  h+='</div>';

  if(S.communityTab==="submit") return h+communitySubmitForm();

  // Browse
  h+='<div style="display:flex;gap:8px;margin-bottom:12px"><input class="set-input" style="flex:1" type="text" placeholder="Search songs..." value="'+escHTML(S.communitySearch)+'" oninput="act(\'communitySearch\',this.value)" aria-label="Search community songs"/>';
  h+='<button onclick="act(\'communitySort\',\''+(S.communitySort==="votes"?"newest":"votes")+'\')" style="padding:8px 12px;border-radius:10px;font-size:12px;font-weight:700;background:var(--input-bg);color:var(--text-muted)">'+(S.communitySort==="votes"?"&#11088; Top":"&#128337; New")+'</button></div>';

  if(S.communityLoading){
    h+='<div class="text-center" style="padding:30px;color:var(--text-muted)">Loading...</div>';
  } else if(S.communityError){
    h+='<div class="card text-center"><p style="color:#FF6B6B;font-size:13px">'+escHTML(S.communityError)+'</p><p style="color:var(--text-muted);font-size:12px;margin-top:8px">Make sure the community server is running:<br><code>cd server && npm start</code></p></div>';
  } else if(S.communitySongs.length===0){
    h+='<div class="card text-center"><p style="color:var(--text-muted);font-size:13px">No community songs yet. Be the first to submit!</p></div>';
  } else {
    h+='<div class="flex-col">';
    for(var i=0;i<S.communitySongs.length;i++){
      var cs=S.communitySongs[i];
      h+='<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><div><h3 style="margin:0;font-size:16px;font-weight:800;color:var(--text-primary)">'+escHTML(cs.title)+'</h3><p style="margin:2px 0 0;font-size:12px;color:var(--text-muted)">'+escHTML(cs.artist)+' | '+escHTML(String(cs.bpm))+' BPM</p></div><div style="display:flex;gap:8px;align-items:center"><button class="vote-btn" onclick="act(\'voteSong\',\''+escHTML(cs.id)+'\')">&#9650; '+escHTML(String(cs.votes))+'</button></div></div>';
      var chords=[];try{chords=JSON.parse(cs.chords);}catch(e){console.error("ChordSpark: failed to parse community song chords",e);}
      if(chords.length){
        h+='<div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap">';
        for(var j=0;j<chords.length;j++)h+='<span style="background:var(--chip-bg);padding:3px 10px;border-radius:10px;font-size:12px;font-weight:700;color:var(--chip-color)">'+escHTML(chords[j])+'</span>';
        h+='</div>';
      }
      h+='<div style="margin-top:8px"><button class="btn" onclick="act(\'playCommunity\',\''+escHTML(cs.id)+'\')" style="padding:8px 16px;font-size:13px;background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">&#9654; Play</button></div>';
      h+='</div>';
    }
    h+='</div>';
  }
  return h;
}

function communitySubmitForm(){
  var ss=S.submitSong;
  var h='<div class="card"><h3 style="margin:0 0 12px;font-size:16px;font-weight:800;color:var(--text-primary)">Submit a Song</h3>';
  h+='<input class="set-input mb12" type="text" placeholder="Song title" value="'+escHTML(ss.title)+'" oninput="act(\'submitField\',\'title:\'+this.value)" aria-label="Song title"/>';
  h+='<input class="set-input mb12" type="text" placeholder="Artist" value="'+escHTML(ss.artist)+'" oninput="act(\'submitField\',\'artist:\'+this.value)" aria-label="Artist name"/>';
  h+='<input class="set-input mb12" type="text" placeholder="Your name (optional)" value="'+escHTML(ss.submittedBy)+'" oninput="act(\'submitField\',\'submittedBy:\'+this.value)" aria-label="Your name"/>';
  h+='<div style="display:flex;gap:8px;margin-bottom:12px"><label style="font-size:12px;color:var(--text-muted);font-weight:600;display:flex;align-items:center;gap:4px">BPM:</label><input class="set-input" type="number" style="width:80px" value="'+ss.bpm+'" oninput="act(\'submitField\',\'bpm:\'+this.value)" aria-label="BPM" min="40" max="200"/></div>';
  h+='<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;font-weight:600">Chords used:</div>';
  h+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">';
  for(var i=0;i<ALL_CHORDS.length;i++){
    var c=ALL_CHORDS[i],sel=ss.chords.indexOf(c.short)!==-1;
    h+='<span class="chord-chip'+(sel?" selected":"")+'"'+clickableDiv("act(\'submitToggleChord\',\'"+c.short+"\')")+'>'+c.short+'</span>';
  }
  h+='</div>';
  h+='<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;font-weight:600">Progression (click chords in order):</div>';
  h+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;min-height:36px;background:var(--input-bg);border-radius:12px;padding:8px">';
  for(var i=0;i<ss.progression.length;i++){
    h+='<span style="background:var(--card-bg);padding:4px 10px;border-radius:8px;font-size:13px;font-weight:700;color:var(--text-primary)">'+escHTML(ss.progression[i])+'</span>';
  }
  if(ss.progression.length===0)h+='<span style="color:var(--text-muted);font-size:12px">Click chords above to build progression...</span>';
  h+='</div>';
  if(ss.progression.length>0)h+='<button onclick="act(\'submitClearProg\')" style="font-size:11px;color:var(--text-muted);background:none;margin-bottom:12px">Clear progression</button>';
  var canSubmit=ss.title.trim()&&ss.artist.trim()&&ss.chords.length>=2&&ss.progression.length>=2;
  h+='<button class="btn" onclick="act(\'submitSong\')" style="width:100%;padding:12px;font-size:14px;background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:#fff;opacity:'+(canSubmit?1:0.5)+'">Submit Song</button>';
  h+='</div>';
  return h;
}

// ===== IMPORT CHORD SHEET SECTION =====
function importSection(){
  var h='<div class="card mb16">';
  h+='<h3 style="margin:0 0 12px;font-size:16px;font-weight:800;color:var(--text-primary)">&#128196; Import Chord Sheet</h3>';
  h+='<p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">Paste a chord sheet using [Am] [G] bracket notation or chord names on their own lines.</p>';
  h+='<textarea class="import-textarea" id="import-textarea" rows="8" placeholder="[Am]   [G]   [C]   [F]\nVerse lyrics here...\n[Am]   [G]   [C]   [F]\nMore lyrics..." oninput="act(\'importText\',this.value)">'+escHTML(S.importText)+'</textarea>';
  h+='<button class="btn" onclick="act(\'parseImport\')" style="width:100%;padding:10px;font-size:14px;margin-top:10px;background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:#fff">&#128270; Parse Chords</button>';
  h+='</div>';

  // Parse result
  if(S.importError){
    h+='<div class="card mb16"><p style="color:#FF6B6B;font-size:13px;margin:0">'+escHTML(S.importError)+'</p></div>';
  }
  if(S.importedSong){
    h+='<div class="card mb16">';
    h+='<h4 style="margin:0 0 10px;font-size:14px;font-weight:800;color:var(--text-primary)">&#9989; Parsed Successfully</h4>';
    h+='<div style="margin-bottom:10px"><label style="font-size:12px;color:var(--text-muted);font-weight:600">Title:</label><input class="set-input" type="text" value="'+escHTML(S.importedSong.title)+'" oninput="act(\'importTitle\',this.value)"/></div>';
    h+='<div style="margin-bottom:10px"><label style="font-size:12px;color:var(--text-muted);font-weight:600">Artist:</label><input class="set-input" type="text" value="'+escHTML(S.importedSong.artist)+'" oninput="act(\'importArtist\',this.value)"/></div>';
    h+='<div style="margin-bottom:10px;display:flex;gap:8px;align-items:center"><label style="font-size:12px;color:var(--text-muted);font-weight:600">BPM:</label><input class="set-input" type="number" style="width:80px" value="'+S.importedSong.bpm+'" oninput="act(\'importBpm\',this.value)" min="40" max="200"/></div>';
    h+='<div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;font-weight:600">Chords found ('+S.importedSong.chords.length+'):</div>';
    h+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">';
    for(var i=0;i<S.importedSong.chords.length;i++){
      var cn=S.importedSong.chords[i];
      var known=false;
      for(var j=0;j<ALL_CHORDS.length;j++)if(ALL_CHORDS[j].name===cn||ALL_CHORDS[j].short===cn){known=true;break;}
      h+='<span style="padding:4px 10px;border-radius:10px;font-size:12px;font-weight:700;background:'+(known?"#4ECDC422":"#FF6B6B22")+';color:'+(known?"#4ECDC4":"#FF6B6B")+';border:1px solid '+(known?"#4ECDC4":"#FF6B6B")+'">'+escHTML(cn)+'</span>';
    }
    h+='</div>';
    h+='<div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;font-weight:600">Progression ('+S.importedSong.progression.length+' chords):</div>';
    h+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;background:var(--input-bg);border-radius:10px;padding:8px">';
    for(var i=0;i<Math.min(S.importedSong.progression.length,32);i++){
      h+='<span style="background:var(--card-bg);padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;color:var(--text-primary)">'+escHTML(S.importedSong.progression[i])+'</span>';
    }
    if(S.importedSong.progression.length>32)h+='<span style="font-size:11px;color:var(--text-muted)">...+'+(S.importedSong.progression.length-32)+' more</span>';
    h+='</div>';
    h+='<button class="btn" onclick="act(\'saveImport\')" style="width:100%;padding:10px;font-size:14px;background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">&#128190; Save as Song</button>';
    h+='</div>';
  }

  // Saved imported songs
  if(S.importedSongs.length>0){
    h+='<div class="card"><h4 style="margin:0 0 10px;font-size:14px;font-weight:800;color:var(--text-primary)">&#127925; My Imported Songs</h4>';
    h+='<div class="flex-col">';
    for(var i=0;i<S.importedSongs.length;i++){
      var sg=S.importedSongs[i];
      h+='<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:var(--input-bg);border-radius:12px">';
      h+='<div><div style="font-size:14px;font-weight:700;color:var(--text-primary)">'+escHTML(sg.title)+'</div>';
      h+='<div style="font-size:11px;color:var(--text-muted)">'+escHTML(sg.artist)+' | '+sg.chords.length+' chords | '+sg.bpm+' BPM</div></div>';
      h+='<div style="display:flex;gap:6px">';
      h+='<button onclick="act(\'playImport\',\''+i+'\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff;padding:6px 12px;border-radius:10px;font-size:12px;font-weight:700">&#9654; Play</button>';
      h+='<button onclick="act(\'deleteImport\',\''+i+'\')" style="background:var(--input-bg);color:#FF6B6B;padding:6px 10px;border-radius:10px;font-size:12px;font-weight:700;border:1px solid var(--border)">&#128465;</button>';
      h+='</div></div>';
    }
    h+='</div></div>';
  }
  return h;
}

// ===== STEM SEPARATION SECTION =====
function stemsSection(){
  var h='<div class="card mb16" style="text-align:center">';
  h+='<div style="font-size:32px;margin-bottom:8px">&#127911;</div>';
  h+='<h3 style="margin:0 0 6px;font-size:18px;font-weight:900;color:var(--text-primary)">Stem Separator</h3>';
  h+='<p style="font-size:12px;color:var(--text-muted);margin:0 0 16px">Import a song to isolate vocals, drums, bass, guitar & piano</p>';

  if(!window.electron){
    h+='<p style="color:#FF6B6B;font-size:13px">Stem separation requires the desktop app (Electron).</p>';
    h+='</div>';
    return h;
  }

  // Import button
  if(S.stemStatus==="idle"||S.stemStatus==="error"||S.stemStatus==="ready"){
    h+='<button onclick="act(\'stemOpenFile\')" style="background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:#fff;padding:12px 28px;border-radius:14px;font-size:15px;font-weight:800;cursor:pointer;border:none">&#128193; Import Audio File</button>';
  }
  h+='</div>';

  // Error
  if(S.stemError){
    h+='<div class="card mb16" style="border:1px solid #FF6B6B"><p style="color:#FF6B6B;font-size:13px;margin:0">'+escHTML(S.stemError)+'</p></div>';
  }

  // Separating progress
  if(S.stemStatus==="separating"){
    h+='<div class="card mb16">';
    h+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">';
    h+='<div style="width:24px;height:24px;border:3px solid var(--border);border-top-color:#4ECDC4;border-radius:50%;animation:spin 1s linear infinite"></div>';
    h+='<div><div style="font-size:14px;font-weight:800;color:var(--text-primary)">Separating stems...</div>';
    h+='<div style="font-size:11px;color:var(--text-muted)">'+(S.stemFile?escHTML(S.stemFile.fileName):"")+'</div></div></div>';
    // Progress bar
    h+='<div style="background:var(--input-bg);border-radius:8px;height:8px;overflow:hidden;margin-bottom:8px">';
    h+='<div style="background:linear-gradient(90deg,#4ECDC4,#45B7D1);height:100%;border-radius:8px;width:'+S.stemProgress+'%;transition:width .3s ease"></div></div>';
    h+='<div style="display:flex;justify-content:space-between;align-items:center">';
    h+='<span style="font-size:12px;color:var(--text-muted)">This may take 5-10 minutes</span>';
    h+='<button onclick="act(\'stemCancel\')" style="background:var(--input-bg);color:#FF6B6B;padding:6px 14px;border-radius:10px;font-size:12px;font-weight:700;border:1px solid var(--border);cursor:pointer">Cancel</button>';
    h+='</div></div>';
  }

  // Ready — show open player button
  if(S.stemStatus==="ready"&&S.stemPaths){
    h+='<div class="card mb16" style="background:linear-gradient(135deg,#4ECDC422,#45B7D122);border:1px solid #4ECDC4">';
    h+='<div style="display:flex;align-items:center;gap:12px">';
    h+='<div style="font-size:28px">&#9989;</div>';
    h+='<div style="flex:1"><div style="font-size:14px;font-weight:800;color:var(--text-primary)">Stems Ready!</div>';
    h+='<div style="font-size:11px;color:var(--text-muted)">'+(S.stemFile?escHTML(S.stemFile.fileName):"")+'</div></div>';
    h+='<button onclick="act(\'stemOpen\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff;padding:10px 20px;border-radius:12px;font-size:14px;font-weight:800;cursor:pointer;border:none">&#127911; Open Player</button>';
    h+='</div></div>';
  }

  // Info card
  h+='<div class="card" style="opacity:0.7">';
  h+='<div style="font-size:12px;color:var(--text-muted);line-height:1.6">';
  h+='<strong>How it works:</strong><br>';
  h+='1. Import an MP3, WAV, or FLAC file<br>';
  h+='2. AI separates it into 6 stems (vocals, drums, bass, guitar, piano, other)<br>';
  h+='3. Toggle stems on/off to play along without guitar, or solo parts to learn them<br>';
  h+='<br><strong>Note:</strong> First separation takes 5-10 minutes. Results are cached for instant replay.';
  h+='</div></div>';

  return h;
}

// ===== STEM PLAYER PAGE =====
function stemsPage(){
  var h='<div style="padding:8px 0">';
  // Header
  h+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">';
  h+='<button onclick="act(\'stemBack\')" style="background:var(--input-bg);border:none;width:36px;height:36px;border-radius:12px;font-size:18px;cursor:pointer;color:var(--text-primary)">&#8592;</button>';
  h+='<div style="flex:1"><div style="font-size:16px;font-weight:900;color:var(--text-primary)">&#127911; Stem Player</div>';
  h+='<div style="font-size:11px;color:var(--text-muted)">'+(S.stemFile?escHTML(S.stemFile.fileName):"")+'</div></div></div>';

  // Stem toggles
  h+='<div class="card mb12">';
  h+='<div style="display:flex;justify-content:flex-end;gap:6px;margin-bottom:8px">';
  h+='<button onclick="act(\'stemAll\')" style="padding:4px 12px;border-radius:8px;font-size:11px;font-weight:700;background:var(--input-bg);color:var(--text-muted);border:1px solid var(--border);cursor:pointer">All On</button>';
  h+='</div>';
  for(var i=0;i<STEM_NAMES.length;i++){
    var name=STEM_NAMES[i];
    if(!S.stemPaths||!S.stemPaths[name])continue;
    var on=S.stemToggles[name];
    var color=STEM_COLORS[name];
    var icon=STEM_ICONS[name];
    h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;'+(i>0?"border-top:1px solid var(--border);":"")+'">';
    h+='<div style="display:flex;align-items:center;gap:10px">';
    h+='<span style="font-size:20px">'+icon+'</span>';
    h+='<span style="font-size:14px;font-weight:700;color:var(--text-primary)">'+name.charAt(0).toUpperCase()+name.slice(1)+'</span>';
    h+='</div>';
    h+='<div style="display:flex;gap:6px">';
    h+='<button onclick="act(\'stemSolo\',\''+name+'\')" style="padding:4px 10px;border-radius:8px;font-size:11px;font-weight:700;background:'+(on&&_isStemSolo(name)?"#FFE66D":"var(--input-bg)")+';color:'+(on&&_isStemSolo(name)?"#333":"var(--text-muted)")+';border:1px solid var(--border);cursor:pointer">Solo</button>';
    h+='<button onclick="act(\'stemToggle\',\''+name+'\')" style="background:'+(on?color:"var(--input-bg)")+';color:'+(on?"#fff":"var(--text-muted)")+';padding:6px 16px;border-radius:10px;font-size:12px;font-weight:800;border:'+(on?"none":"1px solid var(--border)")+';cursor:pointer;min-width:60px">'+(on?"ON":"OFF")+'</button>';
    h+='</div></div>';
  }
  h+='</div>';

  // Playback controls
  h+='<div class="card mb12" style="text-align:center">';
  var cur=formatTime(S.stemCurrentTime);
  var dur=formatTime(S.stemDuration);
  h+='<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">'+cur+' / '+dur+'</div>';
  h+='<input type="range" min="0" max="'+(S.stemDuration||100)+'" step="0.5" value="'+S.stemCurrentTime+'" oninput="act(\'stemSeek\',this.value)" style="width:100%;margin-bottom:12px;accent-color:#4ECDC4"/>';
  h+='<button onclick="act(\'stemPlay\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff;padding:14px 40px;border-radius:16px;font-size:18px;font-weight:800;cursor:pointer;border:none">'+(S.stemPlaying?"&#9646;&#9646; Pause":"&#9654; Play")+'</button>';
  h+='</div>';

  // Volume
  h+='<div class="card">';
  h+='<div style="display:flex;align-items:center;gap:12px">';
  h+='<span style="font-size:16px">&#128266;</span>';
  h+='<input type="range" min="0" max="1" step="0.05" value="'+S.stemVolume+'" oninput="act(\'stemVolume\',this.value)" style="flex:1;accent-color:#4ECDC4"/>';
  h+='<span style="font-size:12px;color:var(--text-muted);font-weight:700;min-width:36px">'+Math.round(S.stemVolume*100)+'%</span>';
  h+='</div></div>';

  h+='</div>';
  return h;
}

function performSubTab(){
  var h='<div class="card mb20" style="text-align:center;padding:24px">';
  h+='<div style="font-size:48px;margin-bottom:12px">&#127928;</div>';
  h+='<h3 style="font-size:18px;font-weight:900;color:var(--text-primary);margin:0 0 8px">Performance Mode</h3>';
  h+='<p style="font-size:13px;color:var(--text-muted);margin:0 0 16px">Play along with a scrolling chord highway. MIDI guitar or mic input.</p>';
  h+='<div class="card" style="cursor:pointer;border:2px solid #4ECDC4;margin-bottom:12px"'
    +clickableDiv("act(\'openPerform\',\'demo_progression\')")+'>';
  h+='<div style="display:flex;justify-content:space-between;align-items:center">';
  h+='<div style="text-align:left"><h4 style="margin:0;font-size:15px;font-weight:800;color:var(--text-primary)">Demo Progression</h4>';
  h+='<p style="margin:2px 0 0;font-size:12px;color:var(--text-muted)">ChordSpark &bull; 90 BPM &bull; 8 chords</p></div>';
  h+='<div style="font-size:24px">&#127918;</div></div></div>';
  h+='<p style="font-size:11px;color:var(--text-muted)">More charts coming soon! MIDI input: '+
    (S.midiEnabled?'<span style="color:#4ECDC4;font-weight:700">Connected</span>':'<span style="color:#FF6B6B">Off &mdash; enable in Tools</span>')+'</p>';
  h+='</div>';
  h+='<div style="text-align:center;margin-top:12px"><button class="btn btn-sm" onclick="act(\'openPerfStats\')" style="background:var(--input-bg);color:var(--text-secondary)">&#128202; View Stats</button></div>';
  return h;
}
