/* PianoSpark - Songs tab */

function songsTab() {
  var html = '';

  // Sub-tabs
  var subtabs = [
    { id:"library", label:"Library" },
    { id:"styles",  label:"Styles" },
    { id:"build",   label:"Builder" },
    { id:"stems",   label:"\u{1F3A7} Stems" }
  ];

  if (!S._songTab) S._songTab = "library";
  html += '<div class="level-tabs">';
  subtabs.forEach(function(t) {
    var active = S._songTab === t.id ? " active" : "";
    html += '<div class="level-tab' + active + '" style="color:var(--accent)" onclick="S._songTab=\'' + t.id + '\';render()">' + t.label + '</div>';
  });
  html += '</div>';

  switch (S._songTab) {
    case "library": html += songLibrary(); break;
    case "styles":  html += stylesTab(); break;
    case "build":   html += buildTab(); break;
    case "stems":   html += stemsSection(); break;
  }
  return html;
}

function songLibrary() {
  var html = '<div class="card"><h2>Song Library</h2>';

  if (S.songIdx !== null && SONGS[S.songIdx]) {
    var song = SONGS[S.songIdx];
    html += '<div class="song-detail">';
    html += '<h3>' + escHTML(song.title) + '</h3>';
    html += '<div class="text-muted">' + escHTML(song.artist) + ' \u2022 Level ' + song.level + '</div>';
    html += '<div class="song-chords">';
    song.chords.forEach(function(ch) {
      var chord = findChord(ch);
      if (chord) html += chordTypeTag(chord);
      else html += '<span class="song-chord-tag">' + escHTML(ch) + '</span>';
    });
    html += '</div>';

    // Progression display
    html += '<div class="progression">';
    song.progression.forEach(function(c, i) {
      var active = S.songPlaying && i === S.songChordIdx;
      html += '<span class="prog-chord ' + (active ? 'prog-active' : '') + '">' + escHTML(c) + '</span>';
    });
    html += '</div>';

    var currentChord = song.progression[S.songChordIdx];
    if (currentChord) html += pianoSVG(findChord(currentChord));

    html += '<div class="song-controls">';
    html += '<button class="btn btn-accent" onclick="act(\'play_song\')">' + (S.songPlaying ? "\u23F8 Pause" : "\u25B6 Play Along") + '</button>';
    html += '<button class="btn" onclick="act(\'open_perform_song\',' + S.songIdx + ')" style="background:var(--accent);color:#fff">Performance</button>';
    html += '<label style="font-size:0.85rem">Tempo: ' + S.bpm + ' BPM</label>';
    html += '<input type="range" min="40" max="200" step="5" value="' + S.bpm + '" onchange="act(\'set_bpm\', this.value)" style="width:80px"/>';
    html += '<button class="btn btn-secondary" onclick="act(\'song_back\')">\u2190 Back</button>';
    html += '</div></div>';
  } else {
    // Search filter
    html += '<input class="intention-input" type="text" placeholder="Search by title, artist, or chord..." value="' + escHTML(S.songFilter) + '" oninput="act(\'song_filter\',this.value)" style="width:100%;margin-bottom:10px"/>';

    // Sort controls
    var sorts = [["level","Level"],["title","Title"],["artist","Artist"],["bpm","BPM"],["chords","Chords"]];
    html += '<div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">';
    sorts.forEach(function(s) {
      var sk = s[0], sl = s[1], active = S.songSort === sk;
      var arrow = active ? (S.songSortAsc ? " \u25B2" : " \u25BC") : "";
      html += '<button onclick="act(\'song_sort\',\'' + sk + '\')" style="padding:5px 12px;border-radius:10px;font-size:0.75rem;font-weight:700;background:' + (active ? "var(--accent)" : "var(--card-bg)") + ';color:' + (active ? "#fff" : "var(--text-muted)") + ';border:1px solid ' + (active ? "var(--accent)" : "var(--border)") + ';cursor:pointer">' + sl + arrow + '</button>';
    });
    html += '</div>';

    // Filter songs
    var filtered = [];
    for (var i = 0; i < SONGS.length; i++) {
      filtered.push({ song: SONGS[i], origIdx: i });
    }
    if (S.songFilter) {
      var q = S.songFilter.toLowerCase();
      filtered = filtered.filter(function(item) {
        var s = item.song;
        return s.title.toLowerCase().indexOf(q) !== -1 ||
               s.artist.toLowerCase().indexOf(q) !== -1 ||
               s.chords.join(" ").toLowerCase().indexOf(q) !== -1;
      });
    }

    // Sort
    var sortKey = S.songSort || "level", asc = S.songSortAsc;
    filtered.sort(function(a, b) {
      var va, vb;
      if (sortKey === "title") { va = a.song.title.toLowerCase(); vb = b.song.title.toLowerCase(); }
      else if (sortKey === "artist") { va = a.song.artist.toLowerCase(); vb = b.song.artist.toLowerCase(); }
      else if (sortKey === "bpm") { va = a.song.bpm; vb = b.song.bpm; }
      else if (sortKey === "chords") { va = a.song.chords.length; vb = b.song.chords.length; }
      else { va = a.song.level; vb = b.song.level; }
      if (va < vb) return asc ? -1 : 1;
      if (va > vb) return asc ? 1 : -1;
      return 0;
    });

    // Count
    html += '<div class="text-muted" style="font-size:0.75rem;margin-bottom:8px">' + filtered.length + ' song' + (filtered.length === 1 ? '' : 's') + (S.songFilter ? ' matching \u201C' + escHTML(S.songFilter) + '\u201D' : '') + '</div>';

    if (S.songSort === "level" && !S.songFilter) {
      // Grouped by level (original view, respecting sort direction)
      var levels = asc ? [1,2,3,4,5,6,7,8] : [8,7,6,5,4,3,2,1];
      levels.forEach(function(l) {
        var lvlSongs = filtered.filter(function(item) { return item.song.level === l; });
        if (!lvlSongs.length) return;
        var locked = l > S.level + 1;
        html += '<h3 style="color:' + levelColor(l) + (locked ? ';opacity:0.4' : '') + '">' + CURRICULUM[l-1].icon + ' Level ' + l + '</h3>';
        html += '<div class="song-list">';
        lvlSongs.forEach(function(item) {
          var s = item.song, idx = item.origIdx;
          var done = S.songsDone && S.songsDone.indexOf(s.title) >= 0;
          html += clickableDiv(
            locked ? '' : "act('select_song'," + idx + ")",
            '<div class="song-row-inner"><span>' + (done ? "\u2705 " : "") + escHTML(s.title) + '</span><span class="text-muted">' + escHTML(s.artist) + ' \u2022 ' + s.bpm + ' BPM \u2022 ' + s.chords.length + ' chords</span></div>',
            "song-row" + (locked ? " locked" : "")
          );
        });
        html += '</div>';
      });
    } else {
      // Flat sorted list (when sorting by title/artist/bpm/chords or filtering)
      html += '<div class="song-list">';
      filtered.forEach(function(item) {
        var s = item.song, idx = item.origIdx;
        var locked = s.level > S.level + 1;
        var done = S.songsDone && S.songsDone.indexOf(s.title) >= 0;
        html += clickableDiv(
          locked ? '' : "act('select_song'," + idx + ")",
          '<div class="song-row-inner"><span style="' + (locked ? 'opacity:0.4' : '') + '">' + (done ? "\u2705 " : "") + escHTML(s.title) + '</span><span class="text-muted">' + escHTML(s.artist) + ' \u2022 Lvl ' + s.level + ' \u2022 ' + s.bpm + ' BPM \u2022 ' + s.chords.length + ' chords</span></div>',
          "song-row" + (locked ? " locked" : "")
        );
      });
      html += '</div>';
      if (filtered.length === 0) html += '<p class="text-muted" style="text-align:center">No songs match your search.</p>';
    }
  }
  html += '</div>';
  return html;
}

// ── Playing Styles ──
function stylesTab() {
  var html = '<div class="card"><h2>Playing Styles</h2>';
  html += '<p>Learn different ways to play piano chords.</p>';

  PLAY_STYLES.forEach(function(ps, i) {
    var active = S.styleIdx === i;
    html += '<div class="style-card ' + (active ? 'active' : '') + '">';
    html += '<div class="style-header" onclick="act(\'select_style\',' + i + ')">';
    html += '<strong>' + ps.name + '</strong> <span class="level-tag">Lvl ' + ps.level + '</span>';
    html += '</div>';
    if (active) {
      html += '<p class="text-muted" style="padding:0 14px">' + ps.desc + '</p>';
      html += styleHTML(ps);
      html += '<div class="style-controls">';
      html += '<label>BPM: ' + S.bpm + '</label>';
      html += '<input type="range" min="40" max="200" value="' + S.bpm + '" onchange="act(\'set_bpm\', this.value)"/>';
      html += '<button class="btn btn-accent" onclick="act(\'play_style\')">\u{1F50A} Demo</button>';
      html += '<button class="btn" onclick="act(\'start_metronome\')">Metro</button>';
      html += '<button class="btn btn-secondary" onclick="act(\'stop_metronome\')">Stop</button>';
      html += '</div>';
    }
    html += '</div>';
  });
  html += '</div>';
  return html;
}

// ── Progression Builder ──
function buildTab() {
  var html = '<div class="card"><h2>Progression Builder</h2>';
  html += '<p>Create your own chord progressions.</p>';

  html += '<div class="build-chords">';
  S.buildChords.forEach(function(c, i) {
    html += '<span class="build-chip">' + escHTML(c) + '<button class="chip-remove" onclick="act(\'build_remove\',' + i + ')">\u2715</button></span>';
  });
  if (!S.buildChords.length) html += '<span class="text-muted">Add chords below</span>';
  html += '</div>';

  if (S.buildChords.length > 0) {
    html += '<div class="build-controls">';
    html += '<button class="btn btn-accent" onclick="act(\'build_play\')">' + (S.buildPlaying ? "\u23F8 Stop" : "\u25B6 Play") + '</button>';
    html += '<button class="btn btn-secondary" onclick="act(\'build_clear\')">Clear</button>';
    html += '</div>';
  }

  html += '<div class="build-palette">';
  var all = chordsUpToLevel(S.level);
  all.forEach(function(c) {
    html += '<button class="btn btn-sm chord-palette-btn" onclick="act(\'build_add\',\'' + c.short + '\')">' + escHTML(c.short) + '</button>';
  });
  html += '</div></div>';
  return html;
}

// ── Stem Separation Section ──
function _isStemSolo(name) {
  var onCount = 0, soloName = "";
  for (var k in S.stemToggles) { if (S.stemToggles[k]) { onCount++; soloName = k; } }
  return onCount === 1 && soloName === name;
}

function stemsSection() {
  var html = '<div class="card" style="text-align:center">';
  html += '<div style="font-size:32px;margin-bottom:8px">\u{1F3A7}</div>';
  html += '<h3>Stem Separator</h3>';
  html += '<p class="text-muted">Import a song to isolate vocals, drums, bass, guitar & piano</p>';

  if (!window.electron) {
    html += '<p style="color:var(--danger)">Stem separation requires the desktop app (Electron). Launch with <code>npm start</code>.</p>';
    html += '</div>';
    return html;
  }

  if (S.stemStatus === "idle" || S.stemStatus === "error" || S.stemStatus === "ready") {
    html += '<button class="btn btn-accent" onclick="act(\'stemOpenFile\')">\u{1F4C2} Import Audio File</button>';
  }
  html += '</div>';

  if (S.stemError) {
    html += '<div class="card" style="border:1px solid var(--danger)"><p style="color:var(--danger)">' + escHTML(S.stemError) + '</p></div>';
  }

  if (S.stemStatus === "separating") {
    html += '<div class="card">';
    html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">';
    html += '<div class="spinner"></div>';
    html += '<div><strong>Separating stems...</strong><br><span class="text-muted">' + (S.stemFile ? escHTML(S.stemFile.fileName) : "") + '</span></div></div>';
    html += '<div class="prog-bar" style="margin-bottom:8px"><div class="prog-fill" style="width:' + S.stemProgress + '%;background:var(--accent)"></div></div>';
    html += '<div style="display:flex;justify-content:space-between;align-items:center">';
    html += '<span class="text-muted" style="font-size:0.8rem">This may take 5-10 minutes</span>';
    html += '<button class="btn btn-sm" style="color:var(--danger)" onclick="act(\'stemCancel\')">Cancel</button>';
    html += '</div></div>';
  }

  if (S.stemStatus === "ready" && S.stemPaths) {
    html += '<div class="card" style="border:1px solid var(--accent)">';
    html += '<div style="display:flex;align-items:center;gap:12px">';
    html += '<span style="font-size:28px">\u2705</span>';
    html += '<div style="flex:1"><strong>Stems Ready!</strong><br><span class="text-muted">' + (S.stemFile ? escHTML(S.stemFile.fileName) : "") + '</span></div>';
    html += '<button class="btn btn-accent" onclick="act(\'stemOpen\')">\u{1F3A7} Open Player</button>';
    html += '</div></div>';
  }

  html += '<div class="card" style="opacity:0.7">';
  html += '<p class="text-muted" style="line-height:1.6"><strong>How it works:</strong><br>';
  html += '1. Import an MP3, WAV, or FLAC file<br>';
  html += '2. AI separates it into 6 stems (vocals, drums, bass, guitar, piano, other)<br>';
  html += '3. Toggle stems on/off to isolate the piano part, or mute it to play along<br>';
  html += '<br><strong>Note:</strong> First separation takes 5-10 minutes. Results are cached.</p></div>';
  return html;
}

function stemsPlayerPage() {
  var html = '<div style="padding:8px 0">';
  html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">';
  html += '<button class="btn btn-sm" onclick="act(\'stemBack\')">\u2190</button>';
  html += '<div style="flex:1"><strong>\u{1F3A7} Stem Player</strong><br><span class="text-muted">' + (S.stemFile ? escHTML(S.stemFile.fileName) : "") + '</span></div></div>';

  html += '<div class="card">';
  html += '<div style="display:flex;justify-content:flex-end;gap:6px;margin-bottom:8px">';
  html += '<button class="btn btn-sm" onclick="act(\'stemAll\')">All On</button>';
  html += '</div>';
  for (var i = 0; i < STEM_NAMES.length; i++) {
    var name = STEM_NAMES[i];
    if (!S.stemPaths || !S.stemPaths[name]) continue;
    var on = S.stemToggles[name];
    var color = STEM_COLORS[name];
    var icon = STEM_ICONS[name];
    html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;' + (i > 0 ? 'border-top:1px solid var(--border);' : '') + '">';
    html += '<div style="display:flex;align-items:center;gap:10px">';
    html += '<span style="font-size:20px">' + icon + '</span>';
    html += '<span style="font-weight:700">' + name.charAt(0).toUpperCase() + name.slice(1) + '</span></div>';
    html += '<div style="display:flex;gap:6px">';
    html += '<button onclick="act(\'stemSolo\',\'' + name + '\')" class="btn btn-sm" style="background:' + (on && _isStemSolo(name) ? '#FFE66D' : 'var(--card-bg)') + ';color:' + (on && _isStemSolo(name) ? '#333' : 'var(--text-muted)') + '">Solo</button>';
    html += '<button onclick="act(\'stemToggle\',\'' + name + '\')" class="btn btn-sm" style="background:' + (on ? color : 'var(--card-bg)') + ';color:' + (on ? '#fff' : 'var(--text-muted)') + ';min-width:52px">' + (on ? 'ON' : 'OFF') + '</button>';
    html += '</div></div>';
  }
  html += '</div>';

  html += '<div class="card" style="text-align:center">';
  html += '<div class="text-muted" style="margin-bottom:8px">' + formatTime(S.stemCurrentTime) + ' / ' + formatTime(S.stemDuration) + '</div>';
  html += '<input type="range" min="0" max="' + (S.stemDuration || 100) + '" step="0.5" value="' + S.stemCurrentTime + '" oninput="act(\'stemSeek\',this.value)" style="width:100%;margin-bottom:12px;accent-color:var(--accent)"/>';
  html += '<button class="btn btn-accent" onclick="act(\'stemPlay\')" style="padding:14px 40px;font-size:1.1rem">' + (S.stemPlaying ? '\u23F8 Pause' : '\u25B6 Play') + '</button>';
  html += '</div>';

  html += '<div class="card"><div style="display:flex;align-items:center;gap:12px">';
  html += '<span>\u{1F50A}</span>';
  html += '<input type="range" min="0" max="1" step="0.05" value="' + S.stemVolume + '" oninput="act(\'stemVolume\',this.value)" style="flex:1;accent-color:var(--accent)"/>';
  html += '<span class="text-muted" style="font-weight:700;min-width:36px">' + Math.round(S.stemVolume * 100) + '%</span>';
  html += '</div></div>';

  html += '</div>';
  return html;
}
