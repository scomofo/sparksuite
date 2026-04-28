(function() {
  var families = [];

  function registerSparkActionFamily(name, handler) {
    if (typeof handler !== "function") return;
    families.push({
      name: name || ("family_" + families.length),
      handle: handler
    });
  }

  function runSparkActionFamilies(action, value) {
    var i;
    for (i = 0; i < families.length; i++) {
      if (families[i] && typeof families[i].handle === "function" && families[i].handle(action, value)) {
        return true;
      }
    }
    return false;
  }

  window.registerSparkActionFamily = registerSparkActionFamily;
  window.runSparkActionFamilies = runSparkActionFamilies;
})();
