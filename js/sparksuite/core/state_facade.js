(function() {
  function SparkStateFacade() {}

  SparkStateFacade.prototype._getGlobalScope = function() {
    if (typeof globalThis !== "undefined") return globalThis;
    if (typeof window !== "undefined") return window;
    return null;
  };

  SparkStateFacade.prototype.getRoot = function() {
    var scope = this._getGlobalScope();
    if (!scope) return null;
    if (scope.__sparkState) return scope.__sparkState;
    if (Object.prototype.hasOwnProperty.call(scope, "S") && scope.S) {
      scope.__sparkState = scope.S;
      return scope.__sparkState;
    }
    return null;
  };

  SparkStateFacade.prototype.setRoot = function(nextRoot) {
    var scope = this._getGlobalScope();
    if (scope) scope.__sparkState = nextRoot || null;
    return nextRoot || null;
  };

  SparkStateFacade.prototype.clone = function(value) {
    if (value == null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.slice();
    var out = {};
    for (var key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) out[key] = value[key];
    }
    return out;
  };

  SparkStateFacade.prototype._normalizePath = function(path) {
    if (Array.isArray(path)) return path.slice();
    return path == null ? [] : [path];
  };

  SparkStateFacade.prototype.read = function(path, fallback) {
    var root = this.getRoot();
    var parts = this._normalizePath(path);
    var cursor = root;
    var i;
    if (!cursor) return fallback;
    for (i = 0; i < parts.length; i++) {
      if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  };

  SparkStateFacade.prototype.write = function(path, value) {
    var root = this.getRoot();
    var parts = this._normalizePath(path);
    var cursor = root;
    var i;
    if (!cursor || !parts.length) return value;
    for (i = 0; i < parts.length - 1; i++) {
      if (!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
    return value;
  };

  SparkStateFacade.prototype.increment = function(path, delta) {
    var current = this.read(path, 0);
    if (typeof current !== "number") current = 0;
    if (typeof delta !== "number") delta = 0;
    return this.write(path, current + delta);
  };

  SparkStateFacade.prototype.max = function(path, value) {
    var current = this.read(path, 0);
    if (typeof current !== "number") current = 0;
    if (typeof value !== "number") value = 0;
    return this.write(path, Math.max(current, value));
  };

  SparkStateFacade.prototype.ensureObject = function(path) {
    var current = this.read(path, null);
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      current = {};
      this.write(path, current);
    }
    return current;
  };

  SparkStateFacade.prototype.ensureArray = function(path) {
    var current = this.read(path, null);
    if (!Array.isArray(current)) {
      current = [];
      this.write(path, current);
    }
    return current;
  };

  SparkStateFacade.prototype.push = function(path, value) {
    var arr = this.ensureArray(path);
    arr.push(value);
    return arr;
  };

  SparkStateFacade.prototype.getLevel = function() {
    var root = this.getRoot();
    return root ? (root.level || root.playerLevel || 1) : 1;
  };

  SparkStateFacade.prototype.setLevel = function(level) {
    var root = this.getRoot();
    if (!root) return level || 1;
    if (Object.prototype.hasOwnProperty.call(root, "playerLevel")) root.playerLevel = level;
    if (Object.prototype.hasOwnProperty.call(root, "level")) root.level = level;
    return level;
  };

  SparkStateFacade.prototype.getChordProgress = function() {
    return this.ensureObject(["chordProgress"]);
  };

  SparkStateFacade.prototype.incrementChordProgress = function(chordName, delta, cap) {
    var chordProgress = this.ensureObject(["chordProgress"]);
    if (!chordName) return 0;
    if (typeof delta !== "number") delta = 0;
    if (typeof cap !== "number") cap = 100;
    chordProgress[chordName] = Math.min((chordProgress[chordName] || 0) + delta, cap);
    return chordProgress[chordName];
  };

  SparkStateFacade.prototype.getCurrentPlanId = function() {
    return this.read(["activeSessionPlanId"], null);
  };

  SparkStateFacade.prototype.setCurrentPlanId = function(planId) {
    return this.write(["activeSessionPlanId"], planId || null);
  };

  SparkStateFacade.prototype.setLastSessionEvents = function(events) {
    return this.write(["lastSessionEvents"], Array.isArray(events) ? events.slice() : []);
  };

  SparkStateFacade.prototype.getEarnedBadges = function() {
    return this.ensureArray(["earnedBadges"]);
  };

  var facade = new SparkStateFacade();
  if (typeof window !== "undefined") window.SparkState = facade;
  if (typeof module !== "undefined") module.exports = SparkStateFacade;
})();
