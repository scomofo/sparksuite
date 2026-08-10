// ===== ChordSpark: Song-related pages and sections =====

function getSongsPageInstrument(){
  var inst;
  var candidate;
  var all;
  var i;
  var entry;
  if (typeof SparkInstruments === "undefined" || !SparkInstruments || typeof SparkInstruments.getActive !== "function") {
    return null;
  }
  inst = SparkInstruments.getActive();
  if (!inst) return null;
  if (typeof inst.getData === "function" || inst.ui) return inst;
  candidate = inst.id || inst.appId || inst.instrumentId || null;
  if (!candidate || typeof SparkInstruments.getAll !== "function") return inst;
  all = SparkInstruments.getAll() || [];
  for (i = 0; i < all.length; i++) {
    entry = all[i] || {};
    if (entry.id === candidate || entry.appId === candidate) return entry;
  }
  return inst;
}

// Helper: check if only one stem is on (solo mode)
function _isStemSolo(name){
  var onCount=0,soloName="";
  for(var k in S.stemToggles){if(S.stemToggles[k]){onCount++;soloName=k;}}
  return onCount===1&&soloName===name;
}

function _formatPerformanceTechniqueLabel(key){
  var labels={
    open:"Open-note timing",
    tap:"Tap-note consistency",
    forced:"Forced-note transitions",
    specialPhrase:"Phrase section control"
  };
  key = _normalizeSongsTextToken(key);
  if (!key) return "";
  return labels[key]||"Technique focus";
}

function _normalizeSongsTextToken(value){
  var text;
  var lower;
  if (typeof value !== "string") return "";
  text = value.replace(/_/g, " ").trim();
  if (!text) return "";
  lower = text.toLowerCase();
  if (lower === "undefined" || lower === "null" || lower === "nan") return "";
  return text;
}

function _firstSongsTextToken(){
  var i;
  var token;
  for (i = 0; i < arguments.length; i++) {
    token = _normalizeSongsTextToken(arguments[i]);
    if (token) return token;
  }
  return "";
}

function _normalizeSongsInputValue(value){
  var text;
  var lower;
  if (typeof value !== "string") return "";
  text = value.trim();
  if (!text) return "";
  lower = text.toLowerCase();
  if (lower === "undefined" || lower === "null" || lower === "nan") return "";
  return value;
}

function _normalizeSongsNumber(value, fallback){
  var num = typeof value === "number" ? value : Number(value);
  return isFinite(num) ? num : fallback;
}

function _formatSongsBpm(value, fallback){
  var bpm = _normalizeSongsNumber(value, null);
  if (bpm == null) return fallback;
  return String(Math.round(bpm));
}

function _normalizeSongsTempoInput(value, fallback){
  var bpm = _normalizeSongsNumber(value, null);
  if (bpm == null) return fallback;
  bpm = Math.round(bpm);
  bpm = Math.max(40, Math.min(200, bpm));
  return bpm;
}

function _getSongsCore(){
  return window.sparkCore || (typeof sparkCore !== "undefined" ? sparkCore : null);
}

function _resolveSongsRuntimeState(){
  var core = _getSongsCore();
  var runtimeState = core && typeof core.getRuntimeState === "function"
    ? core.getRuntimeState()
    : null;
  var coreView = core && typeof core.getActiveSessionView === "function"
    ? core.getActiveSessionView()
    : null;
  return runtimeState || (coreView && coreView.runtimeState ? coreView.runtimeState : null);
}

// Legacy state can carry sub-tab values the page no longer renders (e.g. the
// retired "community" tab) — resolve anything unknown to "builtin" so every
// consumer agrees and a sub-tab always gets the active class.
function _normalizeSongsSubTab(value){
  if (value === "import" || value === "stems" || value === "perform") return value;
  return "builtin";
}

function _getSongsBrowserState(){
  var songBrowserState = _resolveSongsRuntimeState();
  return {
    songsSubTab: _normalizeSongsSubTab(songBrowserState && songBrowserState.songsSubTab ? songBrowserState.songsSubTab : S.songsSubTab),
    songFilter: songBrowserState && typeof songBrowserState.songFilter === "string" ? songBrowserState.songFilter : S.songFilter,
    songSort: songBrowserState && songBrowserState.songSort ? songBrowserState.songSort : S.songSort,
    songSortAsc: songBrowserState && typeof songBrowserState.songSortAsc === "boolean" ? songBrowserState.songSortAsc : S.songSortAsc,
    performanceDailyChallenge: songBrowserState && songBrowserState.performanceDailyChallenge
      ? songBrowserState.performanceDailyChallenge
      : S.performanceDailyChallenge,
    performanceDailyComplete: songBrowserState && typeof songBrowserState.performanceDailyComplete === "boolean"
      ? songBrowserState.performanceDailyComplete
      : S.performanceDailyComplete
  };
}

function _renderSongsSubTabs(songsSubTab){
  var h = '<div class="community-tabs">';
  h += '<button class="community-tab'+(songsSubTab==="builtin"?" active":"")+'" onclick="act(\'songsSubTab\',\'builtin\')">&#127925; Built-in</button>';
  h += '<button class="community-tab'+(songsSubTab==="import"?" active":"")+'" onclick="act(\'songsSubTab\',\'import\')">&#128196; Import</button>';
  h += '<button class="community-tab'+(songsSubTab==="stems"?" active":"")+'" onclick="act(\'songsSubTab\',\'stems\')">&#127911; Stems</button>';
  h += '<button class="community-tab'+(songsSubTab==="perform"?" active":"")+'" onclick="act(\'songsSubTab\',\'perform\')">&#127918; Perform</button>';
  h += '</div>';
  return h;
}

function _renderSongsLibraryHeader(){
  return '<div class="text-center mb16"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">Song Library &#127925;</h2></div>';
}

function _getSpotifyPlaylistPanelState(){
  var core = _getSongsCore();
  var runtime = core && typeof core.getRuntimeState === "function"
    ? core.getRuntimeState()
    : null;
  return {
    connected: !!(runtime && runtime.spotifyPlaylistConnected),
    playlists: runtime && Array.isArray(runtime.spotifyPlaylistPlaylists) ? runtime.spotifyPlaylistPlaylists : [],
    lastSyncAt: runtime && runtime.spotifyPlaylistLastSyncAt ? runtime.spotifyPlaylistLastSyncAt : null,
    lastResult: runtime && runtime.spotifyPlaylistLastResult ? runtime.spotifyPlaylistLastResult : null,
    unresolvedTracks: runtime && Array.isArray(runtime.spotifyPlaylistUnresolvedTracks) ? runtime.spotifyPlaylistUnresolvedTracks : [],
    syncStatus: runtime && runtime.spotifyPlaylistSyncStatus ? runtime.spotifyPlaylistSyncStatus : "idle",
    error: runtime && runtime.spotifyPlaylistError ? runtime.spotifyPlaylistError : null
  };
}

function _getSpotifyPlaylistCurriculumKey(inst){
  var instrumentType = (inst && (inst.instrument || inst.instrumentType)) || "guitar";
  return instrumentType + "_core";
}

function _getSpotifyPlaylistName(inst){
  return "SparkSuite - " + ((inst && inst.name) ? inst.name : "Curriculum");
}

function _getCanonicalSpotifySongMeta(song){
  var contentSongs = typeof window !== "undefined" && window.SparkContent && window.SparkContent.songs
    ? window.SparkContent.songs
    : null;
  var family = typeof getSongFamily === "function" && song && song.id ? getSongFamily(song.id) : null;
  var key;
  var entry;
  if(!contentSongs || !song) return null;
  if(song.id && contentSongs[song.id]) return contentSongs[song.id];
  if(family && family.canonicalSongId && contentSongs[family.canonicalSongId]) return contentSongs[family.canonicalSongId];
  for(key in contentSongs){
    if(!Object.prototype.hasOwnProperty.call(contentSongs, key)) continue;
    entry = contentSongs[key];
    if(!entry) continue;
    if(entry.title === song.title && entry.artist === song.artist) return entry;
  }
  return null;
}

function _getSpotifyCurriculumTracks(songList){
  var songs = Array.isArray(songList) ? songList : [];
  var tracks = [];
  var i;
  var canonical;
  for(i=0;i<songs.length;i++){
    if(!songs[i] || !songs[i].title) continue;
    canonical = _getCanonicalSpotifySongMeta(songs[i]);
    tracks.push({
      id: songs[i].id || (canonical && canonical.id) || "",
      title: songs[i].title,
      artist: songs[i].artist || "",
      uri: songs[i].spotifyTrackUri || (canonical && canonical.spotifyTrackUri) || ""
    });
  }
  return tracks;
}

function _findSpotifyLinkedPlaylist(playlists, curriculumKey){
  var i;
  for(i=0;i<playlists.length;i++){
    if(playlists[i] && playlists[i].curriculum_key === curriculumKey) return playlists[i];
  }
  return null;
}

function _notifySpotifyPlaylist(message){
  if(typeof showToast === "function") showToast(message);
  else if(typeof alert === "function") alert(message);
}

function _ensureSpotifyPlaylistPanelState(){
  var core = _getSongsCore();
  if(!core || typeof core.syncSpotifyPlaylistStatus !== "function") return;
  if(window.__spotifyPlaylistPanelLoading) return;
  if(window.__spotifyPlaylistPanelLoaded) return;
  window.__spotifyPlaylistPanelLoading = true;
  core.syncSpotifyPlaylistStatus().catch(function() {
    return null;
  }).then(function() {
    window.__spotifyPlaylistPanelLoading = false;
    window.__spotifyPlaylistPanelLoaded = true;
    if(window.location && window.location.search && window.location.search.indexOf("spotify=") !== -1 && window.history && window.history.replaceState){
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if(typeof render === "function") render();
  });
}

function sparkSpotifyPlaylistConnect(){
  var core = _getSongsCore();
  if(!core || typeof core.connectSpotifyPlaylist !== "function") return;
  core.connectSpotifyPlaylist({ returnTo: window.location.href });
}

function sparkSpotifyPlaylistCreate(){
  var inst = getSongsPageInstrument();
  var curriculumKey = _getSpotifyPlaylistCurriculumKey(inst);
  var core = _getSongsCore();
  if(!core || typeof core.createSpotifyCurriculumPlaylist !== "function") return;
  core.createSpotifyCurriculumPlaylist({
    curriculumKey: curriculumKey,
    name: _getSpotifyPlaylistName(inst),
    description: "SparkSuite curriculum playlist for " + ((inst && inst.name) ? inst.name : "this instrument"),
    public: false,
    syncMode: "append_missing"
  }).then(function() {
    _notifySpotifyPlaylist("Spotify playlist created.");
    if(typeof render === "function") render();
  }).catch(function(err) {
    _notifySpotifyPlaylist("Spotify playlist create failed: " + (err.message || err));
  });
}

function sparkSpotifyPlaylistSync(){
  var inst = getSongsPageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var curriculumKey = _getSpotifyPlaylistCurriculumKey(inst);
  var tracks = _getSpotifyCurriculumTracks(D.SONGS);
  var core = _getSongsCore();
  if(!core || typeof core.syncSpotifyCurriculumPlaylist !== "function") return;
  core.syncSpotifyCurriculumPlaylist({
    curriculumKey: curriculumKey,
    name: _getSpotifyPlaylistName(inst),
    description: "SparkSuite curriculum playlist for " + ((inst && inst.name) ? inst.name : "this instrument"),
    public: false,
    syncMode: "append_missing",
    createIfMissing: true,
    tracks: tracks
  }).then(function(result) {
    var note = "Spotify playlist synced.";
    if(result && typeof result.addedCount === "number") note += " Added " + result.addedCount + ".";
    if(result && typeof result.unresolvedCount === "number" && result.unresolvedCount > 0) note += " Unmatched " + result.unresolvedCount + ".";
    _notifySpotifyPlaylist(note);
    if(typeof render === "function") render();
  }).catch(function(err) {
    _notifySpotifyPlaylist("Spotify playlist sync failed: " + (err.message || err));
  });
}

function _renderSpotifyPlaylistPanel(inst, songList){
  var state = _getSpotifyPlaylistPanelState();
  var curriculumKey = _getSpotifyPlaylistCurriculumKey(inst);
  var linkedPlaylist = _findSpotifyLinkedPlaylist(state.playlists, curriculumKey);
  var tracks = _getSpotifyCurriculumTracks(songList);
  var exactMappedCount = tracks.filter(function(track){ return !!track.uri; }).length;
  var unresolvedTracks = state.unresolvedTracks || [];
  var unresolvedPreview = unresolvedTracks.slice(0, 6);
  var i;
  var unresolvedLabel;
  var syncBusy = state.syncStatus === "syncing";
  var h = '<div class="card mb16" style="border:2px solid #1DB95422">';
  h += '<div class="split-row" style="gap:12px;margin-bottom:10px">';
  h += '<div><h3 class="card-section-heading">Spotify Curriculum Playlist</h3>';
  h += '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">';
  h += state.connected ? 'Connected' : 'Not connected';
  if(linkedPlaylist && linkedPlaylist.playlist_name) h += ' | ' + escHTML(linkedPlaylist.playlist_name);
  h += '</div></div>';
  h += '<div style="font-size:28px;color:#1DB954">&#9835;</div></div>';
  h += '<div style="font-size:12px;color:var(--text-dim);margin-bottom:10px">Sync the current instrument song library into a private Spotify playlist. Track matching currently uses song title and artist.</div>';
  h += '<div style="font-size:11px;color:var(--text-muted);margin-bottom:10px">Exact `spotifyTrackUri` metadata is used when available, with Spotify search as a fallback.</div>';
  h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">' + tracks.length + ' curriculum songs available for sync';
  h += ' | ' + exactMappedCount + ' exact Spotify matches';
  if(state.lastSyncAt) h += ' | Last sync ' + escHTML(String(state.lastSyncAt));
  h += '</div>';
  if(state.error){
    h += '<div class="card mb12" style="padding:10px;border:1px solid #FF6B6B"><div style="font-size:12px;color:#FF6B6B">'+escHTML(state.error)+'</div></div>';
  }
  if(state.lastResult && typeof state.lastResult.addedCount === "number"){
    h += '<div class="card mb12" style="padding:10px;background:#1DB95410;border:1px solid #1DB95433">';
    h += '<div class="card-micro-heading" style="margin-bottom:4px">Last sync summary</div>';
    h += '<div style="font-size:12px;color:var(--text-muted)">';
    h += 'Resolved ' + escHTML(String(state.lastResult.resolvedCount || 0));
    h += ' | Added ' + escHTML(String(state.lastResult.addedCount || 0));
    h += ' | Skipped ' + escHTML(String(state.lastResult.skippedCount || 0));
    if(typeof state.lastResult.unresolvedCount === "number"){
      h += ' | Unmatched ' + escHTML(String(state.lastResult.unresolvedCount));
    }
    h += '</div></div>';
  }
  if(unresolvedTracks.length){
    unresolvedLabel = unresolvedTracks.length === 1 ? '1 song still needs an exact Spotify match.' : (String(unresolvedTracks.length) + ' songs still need exact Spotify matches.');
    h += '<div class="card mb12" style="padding:10px;border:1px solid #FFB84D;background:#FFB84D10">';
    h += '<div class="card-micro-heading" style="margin-bottom:4px">Needs catalog cleanup</div>';
    h += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">' + escHTML(unresolvedLabel) + '</div>';
    for(i=0;i<unresolvedPreview.length;i++){
      h += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px">';
      h += '&bull; ' + escHTML(unresolvedPreview[i].title || unresolvedPreview[i].id || 'Unknown Song');
      if(unresolvedPreview[i].artist) h += ' <span style="color:var(--text-muted)">by ' + escHTML(unresolvedPreview[i].artist) + '</span>';
      h += '</div>';
    }
    if(unresolvedTracks.length > unresolvedPreview.length){
      h += '<div style="font-size:11px;color:var(--text-dim);margin-top:4px">+' + escHTML(String(unresolvedTracks.length - unresolvedPreview.length)) + ' more unmatched songs</div>';
    }
    h += '</div>';
  }
  h += '<div style="display:flex;gap:8px;flex-wrap:wrap">';
  h += '<button class="btn btn-sm" onclick="act(\'spotifyPlaylistConnect\')" style="background:#1DB954;color:#fff"'+(syncBusy?' disabled':'')+'>'+(state.connected?'Reconnect Spotify':'Connect Spotify')+'</button>';
  h += '<button class="btn btn-sm" onclick="act(\'spotifyPlaylistCreate\')" style="background:var(--input-bg);color:var(--text-secondary)"'+((!state.connected||syncBusy)?' disabled':'')+'>Create Playlist</button>';
  h += '<button class="btn btn-sm" onclick="act(\'spotifyPlaylistSync\')" style="background:linear-gradient(135deg,#1DB954,#1ed760);color:#fff"'+((!state.connected||syncBusy)?' disabled':'')+'>'+(syncBusy?'Syncing...':'Sync Playlist')+'</button>';
  h += '</div></div>';
  return h;
}

function _renderPerformanceDailyCard(performanceDailyChallenge, performanceDailyComplete){
  var performanceDailyLabel;
  var performanceDailyReason;
  var dailyTechniqueLabel;
  var h = "";
  if(!performanceDailyChallenge) return h;
  performanceDailyLabel = _firstSongsTextToken(
    performanceDailyChallenge.label,
    performanceDailyChallenge.songTitle,
    performanceDailyChallenge.songId,
    "Performance challenge"
  );
  performanceDailyReason = _firstSongsTextToken(performanceDailyChallenge.reason);
  dailyTechniqueLabel = performanceDailyChallenge.techniqueKey ? _formatPerformanceTechniqueLabel(performanceDailyChallenge.techniqueKey) : "";
  h += '<div class="card mb20" style="border:2px solid '+(performanceDailyComplete?"#4ECDC4":"#FFE66D")+'">';
  h += '<div class="split-row" style="gap:12px">';
  h += '<div><h3 class="card-section-heading">'+(performanceDailyComplete?'&#9989;':'&#127919;')+' Performance Daily</h3>';
  h += '<p style="margin:3px 0 0;font-size:12px;color:var(--text-muted)">'+escHTML(performanceDailyLabel)+'</p>';
  if(dailyTechniqueLabel){
    h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">';
    h += '<span style="background:#FF6B6B22;color:#FF6B6B;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em">Focus: '+escHTML(dailyTechniqueLabel)+'</span>';
    if(performanceDailyChallenge.target&&performanceDailyChallenge.target.accuracy){
      h += '<span style="background:var(--chip-bg);color:var(--chip-color);padding:3px 8px;border-radius:999px;font-size:10px;font-weight:800">Target '+escHTML(String(performanceDailyChallenge.target.accuracy))+'%</span>';
    }
    h += '</div>';
  }
  if(performanceDailyReason){
    h += '<p style="margin:6px 0 0;font-size:11px;color:var(--text-dim)">'+escHTML(performanceDailyReason)+'</p>';
  }
  h += '<p style="margin:6px 0 0;font-size:11px;color:var(--text-dim)">+'+performanceDailyChallenge.xp+' XP</p></div>';
  if(!performanceDailyComplete){
    h += '<button class="btn" onclick="act(\'openPerformanceDaily\')" style="background:linear-gradient(135deg,#FFE66D,#FF8A5C);color:#333;font-weight:800">Go</button>';
  }
  h += '</div></div>';
  return h;
}

function _renderSongsSearchAndSort(songFilter, songSort, songSortAsc){
  var safeSongFilter = _normalizeSongsInputValue(songFilter);
  var sorts=[["level","Level"],["title","Title"],["artist","Artist"],["bpm","BPM"],["chords","Chords"]];
  var h = '<div style="margin-bottom:12px"><input class="set-input" type="text" placeholder="Search by title, artist, or chord..." value="'+escHTML(safeSongFilter)+'" oninput="act(\'songFilter\',this.value)" aria-label="Filter songs"/></div>';
  h += '<div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">';
  for(var si=0;si<sorts.length;si++){
    var sk=sorts[si][0],sl=sorts[si][1],active=songSort===sk;
    var arrow=active?(songSortAsc?" &#9650;":" &#9660;"):"";
    h += '<button onclick="act(\'songSort\',\''+sk+'\')" style="padding:5px 12px;border-radius:10px;font-size:11px;font-weight:700;background:'+(active?"#4ECDC4":"var(--input-bg)")+';color:'+(active?"#fff":"var(--text-muted)")+';border:1px solid '+(active?"#4ECDC4":"var(--border)")+'">'+sl+arrow+'</button>';
  }
  h += '</div>';
  return {
    html: h,
    safeSongFilter: safeSongFilter
  };
}

function _getFilteredSongs(songList, songFilter, songSort, songSortAsc){
  var filtered = songList.slice();
  var sortKey = songSort || "level";
  var asc = songSortAsc;
  if(songFilter){
    var q = songFilter.toLowerCase();
    filtered = filtered.filter(function(s){
      return s.title.toLowerCase().indexOf(q)!==-1||
             s.artist.toLowerCase().indexOf(q)!==-1||
             s.chords.join(" ").toLowerCase().indexOf(q)!==-1;
    });
  }
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
  return filtered;
}

function _renderSongsList(filtered, D, safeSongFilter){
  var h = '<div class="metric-label" style="margin-bottom:8px">'+filtered.length+' song'+(filtered.length===1?"":"s")+(safeSongFilter?" matching &ldquo;"+escHTML(safeSongFilter)+"&rdquo;":"")+'</div>';
  h += '<div class="flex-col">';
  for(var i=0;i<filtered.length;i++){
    var s=filtered[i];
    // Engine-owned gate: the CurriculumEngine decides whether a song is
    // unlocked; the inline level check remains only as a no-service fallback.
    var _readiness = (typeof SparkCurriculumService !== "undefined" && typeof SparkCurriculumService.getSongReadiness === "function")
      ? SparkCurriculumService.getSongReadiness(s)
      : null;
    var lk = _readiness ? !_readiness.unlocked : s.level > S.level;
    var songTitle = _firstSongsTextToken(s.title, s.songTitle, s.id, "Song");
    var songArtist = _firstSongsTextToken(s.artist, "Unknown Artist");
    var songLibraryIndex = D.SONGS.indexOf(s);
    var _lockHint = lk && _readiness
      ? ' title="Unlocks at level '+_readiness.requiredLevel+(_readiness.chordsToLearn.length?' &bull; chords to learn: '+escHTML(_readiness.chordsToLearn.join(", ")):'')+'"'
      : '';
    h += '<div class="card"'+_lockHint+' style="opacity:'+(lk?0.4:1)+';cursor:'+(lk?"default":"pointer")+'"'+(lk?'':clickableDiv("act(\'openSong\',"+songLibraryIndex+")"))+'">';
    h += '<div class="split-row" style="gap:12px"><div><h3 class="card-section-heading">'+escHTML(songTitle)+'</h3><p class="metric-label" style="margin:2px 0 0">'+escHTML(songArtist)+'</p></div><div style="text-align:right"><div class="metric-value" style="color:'+(D.LC && D.LC[s.level] || '#999')+'">Lvl '+s.level+'</div><div class="metric-label">'+_formatSongsBpm(s.bpm, "--")+' BPM &bull; '+s.chords.length+' chords</div>';
    if(typeof getPerformanceStats==="function"){
      var _songStatsId = typeof resolvePerformanceSongId === "function"
        ? resolvePerformanceSongId(s, songTitle)
        : s.title.toLowerCase().replace(/[^a-z0-9]+/g,"_");
      var _ps=getPerformanceStats(_songStatsId+"_perf","chords",S.performDifficulty);
      if(_ps.mastery!=="none"){
      h += '<div class="metric-value" style="color:'+getMasteryColor(_ps.mastery)+'">'+getMasteryIcon(_ps.mastery)+' '+_ps.mastery+'</div>';
      }
    }
    h += '</div></div>';
    h += '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">';
    for(var j=0;j<s.chords.length;j++) {
      h += '<span style="background:var(--chip-bg);padding:3px 10px;border-radius:10px;font-size:12px;font-weight:700;color:var(--chip-color)">'+escHTML(s.chords[j])+'</span>';
    }
    h += '</div>';
    if(s.progression&&s.progression.length>0&&!lk){
      h += '<div class="song-controls action-row" style="margin-top:6px"><button class="btn btn-sm song-perform-btn" onclick="act(\'openPerformSong\','+D.SONGS.indexOf(s)+')">&#127918; Perform</button></div>';
    }
    h += '</div>';
  }
  if(filtered.length===0) h += '<div class="card text-center"><p style="color:var(--text-muted);font-size:13px">No songs match your search.</p></div>';
  h += '</div>';
  return h;
}

function _renderPerformIntro(){
  return '<div style="font-size:48px;margin-bottom:12px">&#127928;</div><h3 class="card-section-heading" style="font-size:18px;margin-bottom:8px">Performance Mode</h3><p style="font-size:13px;color:var(--text-muted);margin:0 0 16px">Play along with a scrolling chord highway. MIDI guitar or mic input.</p>';
}

function _renderPerformFooter(){
  return '<p style="font-size:11px;color:var(--text-muted)">More charts coming soon! MIDI input: '+(S.midiEnabled?'<span style="color:#4ECDC4;font-weight:700">Connected</span>':'<span style="color:#FF6B6B">Off &mdash; enable in Tools</span>')+'</p></div><div style="text-align:center;margin-top:12px"><button class="btn btn-sm" onclick="act(\'openPerfStats\')" style="background:var(--input-bg);color:var(--text-secondary)">&#128202; View Stats</button></div>';
}

function _renderPerformChartCard(chart){
  var accent=chart.accentColor||"#4ECDC4";
  var icon=chart.sourceType==="imported_package"?"&#128230;":"&#127918;";
  var chartTitle = _firstSongsTextToken(chart.title, chart.songTitle, chart.id, "Performance chart");
  var chartArtist = _firstSongsTextToken(chart.artist, "Unknown Artist");
  var chartBadgeText = _firstSongsTextToken(chart.badge);
  var chartDescription = _firstSongsTextToken(chart.description);
  var badge=chartBadgeText?'<span class="metric-label" style="text-transform:uppercase;letter-spacing:.08em;color:'+accent+'">'+escHTML(chartBadgeText)+'</span>':'';
  var h='<div class="card" style="cursor:pointer;border:2px solid '+accent+';margin-bottom:12px"'+clickableDiv("act(\'openPerform\',\'"+chart.id+"\')")+'>';
  h+='<div class="split-row" style="gap:12px">';
  h+='<div style="text-align:left"><div style="display:flex;align-items:center;gap:8px;margin-bottom:2px"><h4 class="card-section-heading">'+escHTML(chartTitle)+'</h4>'+badge+'</div>';
  h+='<p class="metric-label" style="margin:2px 0 0">'+escHTML(chartArtist)+' &bull; '+escHTML(_formatSongsBpm(chart.bpm, "--"))+' BPM</p>';
  if(chartDescription)h+='<p style="margin:4px 0 0;font-size:11px;color:var(--text-dim)">'+escHTML(chartDescription)+'</p>';
  h+='</div>';
  h+='<div style="font-size:24px">'+icon+'</div></div></div>';
  return h;
}

function _renderImportSourceCard(){
  var h='<div class="card mb16">';
  h+='<h3 class="card-section-heading" style="margin-bottom:12px">&#128196; Import Chord Sheet</h3>';
  h+='<p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">Paste a chord sheet using [Am] [G] bracket notation or chord names on their own lines.</p>';
  h+='<textarea class="import-textarea" id="import-textarea" rows="8" placeholder="[Am]   [G]   [C]   [F]\nVerse lyrics here...\n[Am]   [G]   [C]   [F]\nMore lyrics..." oninput="act(\'importText\',this.value)">'+escHTML(_normalizeSongsInputValue(S.importText))+'</textarea>';
  h+='<button class="btn" onclick="act(\'parseImport\')" style="width:100%;padding:10px;font-size:14px;margin-top:10px;background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:#fff">&#128270; Parse Chords</button>';
  h+='</div>';
  return h;
}

function _renderImportedSongPreviewCard(importedSong, D){
  var importedFormTitle = _firstSongsTextToken(importedSong.title, importedSong.songTitle, importedSong.id);
  var importedFormArtist = _firstSongsTextToken(importedSong.artist);
  var importedFormBpm = _normalizeSongsTempoInput(importedSong.bpm, 90);
  var h='<div class="card mb16">';
  h+='<h4 class="card-micro-heading" style="margin-bottom:10px">&#9989; Parsed Successfully</h4>';
  h+='<div style="margin-bottom:10px"><label class="metric-label">Title:</label><input class="set-input" type="text" value="'+escHTML(importedFormTitle)+'" oninput="act(\'importTitle\',this.value)"/></div>';
  h+='<div style="margin-bottom:10px"><label class="metric-label">Artist:</label><input class="set-input" type="text" value="'+escHTML(importedFormArtist)+'" oninput="act(\'importArtist\',this.value)"/></div>';
  h+='<div style="margin-bottom:10px;display:flex;gap:8px;align-items:center"><label class="metric-label">BPM:</label><input class="set-input" type="number" style="width:80px" value="'+importedFormBpm+'" oninput="act(\'importBpm\',this.value)" min="40" max="200"/></div>';
  h+='<div class="card-micro-heading" style="margin-bottom:6px">Chords found ('+importedSong.chords.length+'):</div>';
  h+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">';
  for(var i=0;i<importedSong.chords.length;i++){
    var cn=importedSong.chords[i];
    var known=false;
    for(var j=0;j<D.ALL_CHORDS.length;j++)if(D.ALL_CHORDS[j].name===cn||D.ALL_CHORDS[j].short===cn){known=true;break;}
    h+='<span style="padding:4px 10px;border-radius:10px;font-size:12px;font-weight:700;background:'+(known?"#4ECDC422":"#FF6B6B22")+';color:'+(known?"#4ECDC4":"#FF6B6B")+';border:1px solid '+(known?"#4ECDC4":"#FF6B6B")+'">'+escHTML(cn)+'</span>';
  }
  h+='</div>';
  h+='<div class="card-micro-heading" style="margin-bottom:6px">Progression ('+importedSong.progression.length+' chords):</div>';
  h+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;background:var(--input-bg);border-radius:10px;padding:8px">';
  for(var k=0;k<Math.min(importedSong.progression.length,32);k++){
    h+='<span style="background:var(--card-bg);padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;color:var(--text-primary)">'+escHTML(importedSong.progression[k])+'</span>';
  }
  if(importedSong.progression.length>32)h+='<span style="font-size:11px;color:var(--text-muted)">...+'+(importedSong.progression.length-32)+' more</span>';
  h+='</div>';
  h+='<button class="btn" onclick="act(\'saveImport\')" style="width:100%;padding:10px;font-size:14px;background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff">&#128190; Save as Song</button>';
  h+='</div>';
  return h;
}

function _renderSavedImportedSongs(importedSongs){
  var h='<div class="card"><h4 class="card-section-heading" style="margin-bottom:10px">&#127925; My Imported Songs</h4>';
  h+='<div class="flex-col">';
  for(var i=0;i<importedSongs.length;i++){
    var sg=importedSongs[i];
    var importedTitle = _firstSongsTextToken(sg.title, sg.songTitle, sg.id, "Imported song");
    var importedArtist = _firstSongsTextToken(sg.artist, "Unknown Artist");
    h+='<div class="split-row" style="gap:12px;padding:10px;background:var(--input-bg);border-radius:12px">';
    h+='<div><div class="metric-value">'+escHTML(importedTitle)+'</div>';
    h+='<div class="metric-label">'+escHTML(importedArtist)+' | '+sg.chords.length+' chords | '+_formatSongsBpm(sg.bpm, "--")+' BPM</div></div>';
    h+='<div class="action-row" style="gap:6px">';
    h+='<button onclick="act(\'playImport\',\''+i+'\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff;padding:6px 12px;border-radius:10px;font-size:12px;font-weight:700">&#9654; Play</button>';
    h+='<button onclick="act(\'deleteImport\',\''+i+'\')" style="background:var(--input-bg);color:#FF6B6B;padding:6px 10px;border-radius:10px;font-size:12px;font-weight:700;border:1px solid var(--border)">&#128465;</button>';
    h+='</div></div>';
  }
  h+='</div></div>';
  return h;
}

function _renderStemSectionHeader(){
  var h='<div class="card mb16" style="text-align:center">';
  h+='<div style="font-size:32px;margin-bottom:8px">&#127911;</div>';
  h+='<h3 class="card-section-heading" style="font-size:18px;margin-bottom:6px">Stem Separator</h3>';
  h+='<p style="font-size:12px;color:var(--text-muted);margin:0 0 16px">Import a song to isolate vocals, drums, bass, guitar & piano</p>';
  if(!window.electron){
    h+='<p style="color:#FF6B6B;font-size:13px">Stem separation requires the desktop app (Electron).</p>';
    h+='</div>';
    return h;
  }
  if(S.stemStatus==="idle"||S.stemStatus==="error"||S.stemStatus==="ready"){
    h+='<button onclick="act(\'stemOpenFile\')" style="background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:#fff;padding:12px 28px;border-radius:14px;font-size:15px;font-weight:800;cursor:pointer;border:none">&#128193; Import Audio File</button>';
  }
  h+='</div>';
  return h;
}

function _renderStemProgressCard(){
  var h='<div class="card mb16">';
  h+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">';
  h+='<div style="width:24px;height:24px;border:3px solid var(--border);border-top-color:#4ECDC4;border-radius:50%;animation:spin 1s linear infinite"></div>';
  h+='<div><div class="card-micro-heading">Separating stems...</div>';
  h+='<div style="font-size:11px;color:var(--text-muted)">'+(S.stemFile?escHTML(S.stemFile.fileName):"")+'</div></div></div>';
  h+='<div style="background:var(--input-bg);border-radius:8px;height:8px;overflow:hidden;margin-bottom:8px">';
  h+='<div style="background:linear-gradient(90deg,#4ECDC4,#45B7D1);height:100%;border-radius:8px;width:'+S.stemProgress+'%;transition:width .3s ease"></div></div>';
  h+='<div class="split-row" style="gap:12px">';
  h+='<span style="font-size:12px;color:var(--text-muted)">This may take 5-10 minutes</span>';
  h+='<button onclick="act(\'stemCancel\')" style="background:var(--input-bg);color:#FF6B6B;padding:6px 14px;border-radius:10px;font-size:12px;font-weight:700;border:1px solid var(--border);cursor:pointer">Cancel</button>';
  h+='</div></div>';
  return h;
}

function _renderStemReadyCard(){
  var h='<div class="card mb16" style="background:linear-gradient(135deg,#4ECDC422,#45B7D122);border:1px solid #4ECDC4">';
  h+='<div style="display:flex;align-items:center;gap:12px">';
  h+='<div style="font-size:28px">&#9989;</div>';
  h+='<div style="flex:1"><div class="card-micro-heading">Stems Ready!</div>';
  h+='<div style="font-size:11px;color:var(--text-muted)">'+(S.stemFile?escHTML(S.stemFile.fileName):"")+'</div></div>';
  h+='<button onclick="act(\'stemOpen\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff;padding:10px 20px;border-radius:12px;font-size:14px;font-weight:800;cursor:pointer;border:none">&#127911; Open Player</button>';
  h+='</div></div>';
  return h;
}

function _renderStemInfoCard(){
  return '<div class="card" style="opacity:0.7"><div style="font-size:12px;color:var(--text-muted);line-height:1.6"><strong>How it works:</strong><br>1. Import an MP3, WAV, or FLAC file<br>2. AI separates it into 6 stems (vocals, drums, bass, guitar, piano, other)<br>3. Toggle stems on/off to play along without guitar, or solo parts to learn them<br><br><strong>Note:</strong> First separation takes 5-10 minutes. Results are cached for instant replay.</div></div>';
}

function _renderStemPlayerHeader(){
  return '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px"><button onclick="act(\'stemBack\')" style="background:var(--input-bg);border:none;width:36px;height:36px;border-radius:12px;font-size:18px;cursor:pointer;color:var(--text-primary)">&#8592;</button><div style="flex:1"><div class="card-section-heading">&#127911; Stem Player</div><div class="metric-label">'+(S.stemFile?escHTML(S.stemFile.fileName):"")+'</div></div></div>';
}

function _renderStemToggleRows(){
  var h='<div class="card mb12">';
  h+='<div style="display:flex;justify-content:flex-end;gap:6px;margin-bottom:8px">';
  h+='<button onclick="act(\'stemAll\')" style="padding:4px 12px;border-radius:8px;font-size:11px;font-weight:700;background:var(--input-bg);color:var(--text-muted);border:1px solid var(--border);cursor:pointer">All On</button>';
  h+='</div>';
  for(var i=0;i<STEM_NAMES.length;i++){
    var name=STEM_NAMES[i];
    if(!S.stemPaths||!S.stemPaths[name])continue;
    var on=S.stemToggles[name];
    var color=STEM_COLORS[name];
    var icon=STEM_ICONS[name];
    h+='<div class="split-row" style="gap:12px;padding:10px 0;'+(i>0?"border-top:1px solid var(--border);":"")+'">';
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
  return h;
}

function _renderStemPlaybackCard(stemCurrentTime, stemDuration, stemPlaying){
  var cur=formatTime(stemCurrentTime);
  var dur=formatTime(stemDuration);
  var h='<div class="card mb12" style="text-align:center">';
  h+='<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">'+cur+' / '+dur+'</div>';
  h+='<input type="range" min="0" max="'+(stemDuration||100)+'" step="0.5" value="'+stemCurrentTime+'" oninput="act(\'stemSeek\',this.value)" style="width:100%;margin-bottom:12px;accent-color:#4ECDC4"/>';
  h+='<button onclick="act(\'stemPlay\')" style="background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff;padding:14px 40px;border-radius:16px;font-size:18px;font-weight:800;cursor:pointer;border:none">'+(stemPlaying?"&#9646;&#9646; Pause":"&#9654; Play")+'</button>';
  h+='</div>';
  return h;
}

function _renderStemVolumeCard(){
  var stemVolume = Math.max(0, Math.min(1, _normalizeSongsNumber(S.stemVolume, 1)));
  return '<div class="card"><div style="display:flex;align-items:center;gap:12px"><span style="font-size:16px">&#128266;</span><input type="range" min="0" max="1" step="0.05" value="'+stemVolume+'" oninput="act(\'stemVolume\',this.value)" style="flex:1;accent-color:#4ECDC4"/><span style="font-size:12px;color:var(--text-muted);font-weight:700;min-width:36px">'+Math.round(stemVolume*100)+'%</span></div></div>';
}

// ===== STRUM TAB =====
function strumTab(){
  var inst = getSongsPageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var h='<div class="text-center mb16"><h2 style="font-size:22px;font-weight:900;color:var(--text-primary)">Strum Patterns &#127932;</h2></div><div class="flex-col">';
  for(var i=0;i<STRUM_PATTERNS.length;i++){
    var sp=STRUM_PATTERNS[i];
    var _spReadiness = (typeof SparkCurriculumService !== "undefined" && typeof SparkCurriculumService.getSongReadiness === "function")
      ? SparkCurriculumService.getSongReadiness(sp)
      : null;
    var lk = _spReadiness ? !_spReadiness.unlocked : sp.level > S.level;
    h+='<div class="card" style="opacity:'+(lk?0.4:1)+';cursor:'+(lk?"default":"pointer")+'"'+(lk?'':clickableDiv("act(\'openStrum\',\'"+sp.name+"\')"))+'">';
    h+='<div class="split-row" style="gap:12px"><div><h3 class="card-section-heading">'+sp.name+'</h3><p class="metric-label" style="margin:4px 0 0">'+sp.desc+'</p></div><div style="text-align:right"><div class="metric-value" style="color:'+(D.LC && D.LC[sp.level] || '#999')+'">Lvl '+sp.level+'</div><div class="metric-label">'+_formatSongsBpm(sp.bpm, "--")+' BPM</div></div></div>';
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
  var inst = getSongsPageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var browserState = _getSongsBrowserState();
  var songsSubTab = browserState.songsSubTab;
  var songFilter = browserState.songFilter;
  var songSort = browserState.songSort;
  var songSortAsc = browserState.songSortAsc;
  var performanceDailyChallenge = browserState.performanceDailyChallenge;
  var performanceDailyComplete = browserState.performanceDailyComplete;
  var searchAndSort;
  var filtered;
  _ensureSpotifyPlaylistPanelState();
  var h=_renderSongsLibraryHeader();
  h += _renderSongsSubTabs(songsSubTab);

  if(songsSubTab==="import") return h+importSection();
  if(songsSubTab==="stems") return h+stemsSection();
  if(songsSubTab==="perform") return h+performSubTab();

  var songList = Array.isArray(D.SONGS) ? D.SONGS : [];
  h += _renderSpotifyPlaylistPanel(inst, songList);
  h += _renderPerformanceDailyCard(performanceDailyChallenge, performanceDailyComplete);
  searchAndSort = _renderSongsSearchAndSort(songFilter, songSort, songSortAsc);
  filtered = _getFilteredSongs(songList, songFilter, songSort, songSortAsc);
  h += searchAndSort.html;
  h += _renderSongsList(filtered, D, searchAndSort.safeSongFilter);
  return h;
}

// ===== IMPORT CHORD SHEET SECTION =====
function importSection(){
  var inst = getSongsPageInstrument();
  var D = inst && inst.getData ? inst.getData() : {};
  var h=_renderImportSourceCard();

  // Parse result
  if(S.importError){
    h+='<div class="card mb16"><p style="color:#FF6B6B;font-size:13px;margin:0">'+escHTML(S.importError)+'</p></div>';
  }
  if(S.importedSong){
    h+=_renderImportedSongPreviewCard(S.importedSong, D);
  }

  // Saved imported songs
  if(S.importedSongs.length>0){
    h+=_renderSavedImportedSongs(S.importedSongs);
  }
  return h;
}

// ===== STEM SEPARATION SECTION =====
function stemsSection(){
  var h=_renderStemSectionHeader();
  if(!window.electron) return h;

  // Error
  if(S.stemError){
    h+='<div class="card mb16" style="border:1px solid #FF6B6B"><p style="color:#FF6B6B;font-size:13px;margin:0">'+escHTML(S.stemError)+'</p></div>';
  }

  // Separating progress
  if(S.stemStatus==="separating"){
    h+=_renderStemProgressCard();
  }

  // Ready — show open player button
  if(S.stemStatus==="ready"&&S.stemPaths){
    h+=_renderStemReadyCard();
  }

  h+=_renderStemInfoCard();

  return h;
}

// ===== STEM PLAYER PAGE =====
function stemsPage(){
  var view = null;
  var runtime = null;
  var core = _getSongsCore();
  if (core && typeof core.getActiveSessionView === "function") {
    view = core.getActiveSessionView();
    runtime = view && view.runtimeState ? view.runtimeState : null;
  }
  var stemPlaying = typeof S.stemPlaying === "boolean" ? S.stemPlaying : !!(runtime && runtime.stemPlaying);
  var stemCurrentTime = typeof S.stemCurrentTime === "number" ? S.stemCurrentTime : (runtime && typeof runtime.stemCurrentTime === "number" ? runtime.stemCurrentTime : 0);
  var stemDuration = typeof S.stemDuration === "number" ? S.stemDuration : (runtime && typeof runtime.stemDuration === "number" ? runtime.stemDuration : 0);
  var h='<div style="padding:8px 0">';
  h+=_renderStemPlayerHeader();
  h+=_renderStemToggleRows();
  h+=_renderStemPlaybackCard(stemCurrentTime, stemDuration, stemPlaying);
  h+=_renderStemVolumeCard();

  h+='</div>';
  return h;
}

function performSubTab(){
  var h='<div class="card mb20" style="text-align:center;padding:24px">';
  var activeInst = getSongsPageInstrument();
  var activeType = (activeInst && (activeInst.instrument || activeInst.instrumentType)) || null;
  var charts = typeof getPerformanceChartLibrary === "function"
    ? (activeType ? getPerformanceChartLibrary({ instrument: activeType }) : getPerformanceChartLibrary())
    : [];
  h+=_renderPerformIntro();
  for(var i=0;i<charts.length;i++){
    h+=_renderPerformChartCard(charts[i]);
  }
  h+=_renderPerformFooter();
  return h;
}
