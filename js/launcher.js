// js/launcher.js — SparkInstruments registry and launcher screen
(function() {

  var _instruments = [];
  var _active = null;

  var SparkInstruments = {
    register: function(config) {
      for (var i = 0; i < _instruments.length; i++) {
        if (_instruments[i].id === config.id) return;
      }
      _instruments.push(config);
    },

    activate: function(appId) {
      for (var i = 0; i < _instruments.length; i++) {
        if (_instruments[i].id === appId) {
          _active = _instruments[i];
          if (_active.init) _active.init();
          return;
        }
      }
    },

    deactivate: function() {
      _active = null;
    },

    getActive: function() {
      return _active;
    },

    getAll: function() {
      return _instruments.slice();
    },

    getPage: function(screenId) {
      if (!_active || !_active.pages) return null;
      return _active.pages[screenId] || null;
    },

    renderLauncher: function() {
      var profile = typeof SparkStorage !== "undefined" ? SparkStorage.load() : null;
      var h = '';

      h += '<div style="text-align:center;padding:40px 20px 20px">';
      h += '<div style="font-size:48px;margin-bottom:8px">&#127925;</div>';
      h += '<h1 style="font-size:28px;font-weight:900;margin:0;color:var(--text-primary)">SparkSuite</h1>';

      if (profile) {
        var totalXp = 0, maxStreak = 0;
        for (var appId in profile.apps) {
          var app = profile.apps[appId];
          totalXp += (app.stats ? app.stats.xp : 0);
          var s = app.stats ? app.stats.streakDays : 0;
          if (s > maxStreak) maxStreak = s;
        }
        h += '<div style="color:var(--text-muted);font-size:14px;margin-top:6px">';
        h += '&#9889; ' + totalXp + ' XP';
        if (maxStreak > 0) h += ' &middot; &#128293; ' + maxStreak + ' day streak';
        var badgeCount = profile.suiteRewards ? profile.suiteRewards.badges.length : 0;
        if (badgeCount > 0) h += ' &middot; &#127942; ' + badgeCount + ' badges';
        h += '</div>';
      }
      h += '</div>';

      h += '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:16px;padding:20px;max-width:500px;margin:0 auto">';

      for (var i = 0; i < _instruments.length; i++) {
        var inst = _instruments[i];
        var appStats = null;
        if (profile && profile.apps && profile.apps[inst.id]) {
          appStats = profile.apps[inst.id].stats;
        }

        if (inst.available !== false) {
          h += '<div class="card" style="flex:1;min-width:140px;max-width:200px;text-align:center;cursor:pointer;transition:transform .15s,box-shadow .15s" ';
          h += 'onclick="SparkInstruments.activate(\'' + inst.id + '\');S.activeInstrument=\'' + inst.id + '\';S.screen=SCR.HOME;S.tab=TAB.PRACTICE;saveState();render()" ';
          h += 'onmouseenter="this.style.transform=\'translateY(-4px)\';this.style.boxShadow=\'0 8px 24px rgba(0,0,0,.15)\'" ';
          h += 'onmouseleave="this.style.transform=\'none\';this.style.boxShadow=\'\'">';
          h += '<div style="font-size:48px;margin-bottom:8px">' + inst.icon + '</div>';
          h += '<div style="font-weight:800;font-size:18px;color:var(--text-primary)">' + escHTML(inst.name) + '</div>';
          if (appStats) {
            h += '<div style="color:var(--text-muted);font-size:13px;margin-top:4px">Lvl ' + (appStats.level || 1) + ' &middot; ' + (appStats.xp || 0) + ' XP</div>';
          } else {
            h += '<div style="color:var(--text-muted);font-size:13px;margin-top:4px">Start learning!</div>';
          }
          h += '</div>';
        } else {
          h += '<div class="card" style="flex:1;min-width:140px;max-width:200px;text-align:center;opacity:0.5">';
          h += '<div style="font-size:48px;margin-bottom:8px">' + inst.icon + '</div>';
          h += '<div style="font-weight:800;font-size:18px;color:var(--text-muted)">' + escHTML(inst.name) + '</div>';
          h += '<div style="color:var(--text-muted);font-size:13px;margin-top:4px">Coming Soon</div>';
          h += '</div>';
        }
      }

      h += '</div>';
      return h;
    }
  };

  window.SparkInstruments = SparkInstruments;
})();
