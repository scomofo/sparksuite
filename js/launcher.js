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

      h += '<div class="launcher-header">';
      h += '<div style="font-size:48px;margin-bottom:8px">&#127925;</div>';
      h += '<h1>SparkSuite</h1>';

      if (profile) {
        var totalXp = 0, maxStreak = 0;
        for (var appId in profile.apps) {
          var app = profile.apps[appId];
          totalXp += (app.stats ? app.stats.xp : 0);
          var s = app.stats ? app.stats.streakDays : 0;
          if (s > maxStreak) maxStreak = s;
        }
        h += '<div class="launcher-stats">';
        h += '&#9889; ' + totalXp + ' XP';
        if (maxStreak > 0) h += ' &middot; &#128293; ' + maxStreak + ' day streak';
        var badgeCount = profile.suiteRewards ? profile.suiteRewards.badges.length : 0;
        if (badgeCount > 0) h += ' &middot; &#127942; ' + badgeCount + ' badges';
        h += '</div>';
      }
      h += '</div>';

      h += '<div class="launcher-grid">';

      for (var i = 0; i < _instruments.length; i++) {
        var inst = _instruments[i];
        var appStats = null;
        if (profile && profile.apps && profile.apps[inst.id]) {
          appStats = profile.apps[inst.id].stats;
        }

        if (inst.available !== false) {
          h += '<div class="launcher-card" ';
          h += 'onclick="SparkInstruments.activate(\'' + inst.id + '\');S.activeInstrument=\'' + inst.id + '\';S.screen=SCR.HOME;S.tab=TAB.PRACTICE;saveState();render()">';
          h += '<span class="instrument-icon">' + inst.icon + '</span>';
          h += '<div class="instrument-name">' + escHTML(inst.name) + '</div>';
          if (appStats) {
            h += '<div class="instrument-stats">Lvl ' + (appStats.level || 1) + ' &middot; ' + (appStats.xp || 0) + ' XP</div>';
          } else {
            h += '<div class="instrument-stats">Start learning!</div>';
          }
          h += '</div>';
        } else {
          h += '<div class="launcher-card disabled">';
          h += '<span class="instrument-icon">' + inst.icon + '</span>';
          h += '<div class="instrument-name">' + escHTML(inst.name) + '</div>';
          h += '<div class="instrument-stats">Coming Soon</div>';
          h += '</div>';
        }
      }

      h += '</div>';
      return h;
    }
  };

  window.SparkInstruments = SparkInstruments;
})();
