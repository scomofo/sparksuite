(function() {
  /**
   * SparkTimerManager -- owns all timer lifecycle for SparkSuite apps.
   * Replaces global T handles and tickS/tickD/tickDy functions.
   *
   * Timer handles: session, drill, daily, song, strum, metro, undo, rhythm, prog, fingerEx
   * Callbacks: onRender, onSound, onComplete
   */
  function SparkTimerManager(core) {
    this._core = core;

    // Timer handles (setTimeout / setInterval ids)
    this._handles = {
      session: null,
      drill: null,
      daily: null,
      song: null,
      strum: null,
      metro: null,
      undo: null,
      rhythm: null,
      prog: null,
      fingerEx: null
    };

    // Registered callbacks
    this._callbacks = {
      render: [],
      sound: [],
      complete: []
    };
  }

  // ---- Callback registration ----

  SparkTimerManager.prototype.onRender = function(cb) {
    if (typeof cb === "function") this._callbacks.render.push(cb);
  };

  SparkTimerManager.prototype.onSound = function(cb) {
    if (typeof cb === "function") this._callbacks.sound.push(cb);
  };

  SparkTimerManager.prototype.onComplete = function(cb) {
    if (typeof cb === "function") this._callbacks.complete.push(cb);
  };

  // ---- Internal emitters ----

  SparkTimerManager.prototype._emitRender = function() {
    for (var i = 0; i < this._callbacks.render.length; i++) {
      try { this._callbacks.render[i](); } catch (e) {
        if (typeof console !== "undefined") console.error("[TimerManager] render callback error:", e);
      }
    }
  };

  SparkTimerManager.prototype._emitSound = function(soundName) {
    for (var i = 0; i < this._callbacks.sound.length; i++) {
      try { this._callbacks.sound[i](soundName); } catch (e) {
        if (typeof console !== "undefined") console.error("[TimerManager] sound callback error:", e);
      }
    }
  };

  SparkTimerManager.prototype._emitComplete = function(info) {
    for (var i = 0; i < this._callbacks.complete.length; i++) {
      try { this._callbacks.complete[i](info); } catch (e) {
        if (typeof console !== "undefined") console.error("[TimerManager] complete callback error:", e);
      }
    }
  };

  // ---- Session timer ----

  SparkTimerManager.prototype.startSession = function() {
    this.stopTimer("session");
    var self = this;
    this._handles.session = setTimeout(function() { self.tickSession(); }, 1000);
  };

  SparkTimerManager.prototype.tickSession = function() {
    var ps = this._core.persistedState;
    var rs = this._core.runtimeState;

    if (ps.timerActive && ps.timer > 0) {
      ps.timer--;
      rs.legacyPracticeRemainingSec = ps.timer;

      // Micro-reward every 30s
      if (ps.timer % 30 === 0 && ps.timer > 0) {
        var visible = typeof SparkPsychology !== "undefined" && SparkPsychology.shouldReward(ps.sessions);
        if (visible) {
          this._emitSound("tick");
          if (window.SparkProgressBridge) {
            SparkProgressBridge.applyLegacyReward({ xpDelta: 5, toastAmount: 5 });
          } else {
            ps.xp = (ps.xp || 0) + 5;
            ps.xpToast = { amount: 5, time: Date.now() };
          }
        } else {
          // Silent XP accrual
          if (window.SparkProgressBridge) {
            SparkProgressBridge.applyLegacyReward({ xpDelta: 5 });
          } else {
            ps.xp = (ps.xp || 0) + 5;
          }
        }
      }

      // Halfway micro-event
      if (ps.timer === 60) {
        this._emitComplete({ type: "session", event: "halfway", message: "Halfway there!" });
      }

      // addPracticeSecond via global if available
      if (typeof addPracticeSecond === "function") addPracticeSecond();

      this._emitRender();

      // Schedule next tick
      var self = this;
      this._handles.session = setTimeout(function() { self.tickSession(); }, 1000);

    } else if (ps.timerActive && ps.timer <= 0) {
      this._completeSession();
    }
  };

  SparkTimerManager.prototype._completeSession = function() {
    var ps = this._core.persistedState;
    ps.timerActive = false;
    this.stopTimer("session");

    this._emitComplete({
      type: "session",
      event: "complete",
      chordName: ps.currentChord ? ps.currentChord.name : null,
      mode: ps.lastChordName ? "chord" : "quickStart",
      durationSec: 120
    });
  };

  // ---- Drill timer ----

  SparkTimerManager.prototype.startDrill = function() {
    this.stopTimer("drill");
    var self = this;
    this._handles.drill = setTimeout(function() { self.tickDrill(); }, 1000);
  };

  SparkTimerManager.prototype.tickDrill = function() {
    var ps = this._core.persistedState;

    if (ps.drillTimer > 0) {
      ps.drillTimer--;

      // Micro-reward every 30s
      if (ps.drillTimer % 30 === 0 && ps.drillTimer > 0) {
        var visible = typeof SparkPsychology !== "undefined" && SparkPsychology.shouldReward(ps.sessions);
        if (visible) {
          this._emitSound("tick");
          if (window.SparkProgressBridge) {
            SparkProgressBridge.applyLegacyReward({ xpDelta: 5, toastAmount: 5 });
          } else {
            ps.xp = (ps.xp || 0) + 5;
            ps.xpToast = { amount: 5, time: Date.now() };
          }
        } else {
          if (window.SparkProgressBridge) {
            SparkProgressBridge.applyLegacyReward({ xpDelta: 5 });
          } else {
            ps.xp = (ps.xp || 0) + 5;
          }
        }
      }

      if (typeof addPracticeSecond === "function") addPracticeSecond();

      this._emitRender();

      var self = this;
      this._handles.drill = setTimeout(function() { self.tickDrill(); }, 1000);

    } else if (ps.drillTimer <= 0) {
      this._completeDrill();
    }
  };

  SparkTimerManager.prototype._completeDrill = function() {
    this.stopTimer("drill");

    var ps = this._core.persistedState;
    var chordNames = [];
    if (ps.drillChords && ps.drillChords.length) {
      for (var i = 0; i < ps.drillChords.length; i++) {
        chordNames.push(ps.drillChords[i].name);
      }
    }

    this._emitComplete({
      type: "drill",
      event: "complete",
      chordNames: chordNames,
      durationSec: 60
    });
  };

  // ---- Daily timer ----

  SparkTimerManager.prototype.startDaily = function() {
    this.stopTimer("daily");
    var self = this;
    this._handles.daily = setTimeout(function() { self.tickDaily(); }, 1000);
  };

  SparkTimerManager.prototype.tickDaily = function() {
    var ps = this._core.persistedState;

    if (ps.dailyTimer > 0 && !ps.dailyComplete) {
      ps.dailyTimer--;

      if (typeof addPracticeSecond === "function") addPracticeSecond();

      this._emitRender();

      var self = this;
      this._handles.daily = setTimeout(function() { self.tickDaily(); }, 1000);

    } else if (ps.dailyTimer <= 0 && !ps.dailyComplete) {
      this._completeDaily();
    }
  };

  SparkTimerManager.prototype._completeDaily = function() {
    this.stopTimer("daily");

    var ps = this._core.persistedState;
    var challengeId = ps.dailyChallenge ? ps.dailyChallenge.id : null;
    var durationSec = 60;
    if (challengeId === "hold") durationSec = 30;
    else if (challengeId === "marathon") durationSec = 180;

    this._emitComplete({
      type: "daily",
      event: "complete",
      challengeId: challengeId,
      challengeTitle: ps.dailyChallenge ? ps.dailyChallenge.title : "Challenge",
      xp: (ps.dailyChallenge && ps.dailyChallenge.xp) || 40,
      durationSec: durationSec
    });
  };

  // ---- Generic interval ----

  SparkTimerManager.prototype.startInterval = function(name, cb, ms) {
    if (!this._handles.hasOwnProperty(name)) {
      if (typeof console !== "undefined") console.warn("[TimerManager] Unknown timer name:", name);
      return;
    }
    this.stopTimer(name);
    this._handles[name] = setInterval(cb, ms);
  };

  // ---- Cleanup ----

  SparkTimerManager.prototype.stopTimer = function(name) {
    if (this._handles[name] != null) {
      clearTimeout(this._handles[name]);
      clearInterval(this._handles[name]);
      this._handles[name] = null;
    }
  };

  SparkTimerManager.prototype.stopAll = function() {
    for (var name in this._handles) {
      if (this._handles.hasOwnProperty(name)) {
        this.stopTimer(name);
      }
    }
  };

  SparkTimerManager.prototype.isRunning = function(name) {
    return this._handles[name] != null;
  };

  window.SparkTimerManager = SparkTimerManager;
})();
