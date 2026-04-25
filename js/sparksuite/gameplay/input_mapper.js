(function() {
  var DefaultKeyToLane = {
    a: 0,
    s: 1,
    d: 2,
    f: 3,
    g: 4,
    h: 5
  };

  function InputMapper(keyToLane) {
    this.keyToLane = keyToLane || DefaultKeyToLane;
  }

  InputMapper.prototype.mapKey = function(key) {
    return Object.prototype.hasOwnProperty.call(this.keyToLane, key)
      ? this.keyToLane[key]
      : null;
  };

  if (typeof window !== "undefined") {
    window.SparkDefaultKeyToLane = DefaultKeyToLane;
    window.SparkInputMapper = InputMapper;
  }
  if (typeof module !== "undefined") {
    module.exports = {
      DefaultKeyToLane: DefaultKeyToLane,
      InputMapper: InputMapper
    };
  }
})();
