(function(){

  function editorLibraryRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    if(typeof globalThis !== "undefined"){
      return globalThis.__sparkState || globalThis.S || null;
    }
    return null;
  }

  function editorLibraryRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = editorLibraryRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(!cursor) return fallback;
    for(i=0;i<parts.length;i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function editorLibraryWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = editorLibraryRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(!cursor || !parts.length) return value;
    for(i=0;i<parts.length-1;i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length-1]] = value;
    return value;
  }

  function ensureEditorLibrary(){
    var library = editorLibraryRead("contentLibrary", null);
    if(!library || typeof library !== "object" || Array.isArray(library)) library = {};
    if(!Array.isArray(library.rhythmPatterns)) library.rhythmPatterns = [];
    if(!Array.isArray(library.lhPatterns)) library.lhPatterns = [];
    if(!Array.isArray(library.chordProgressions)) library.chordProgressions = [];
    if(!Array.isArray(library.exercises)) library.exercises = [];
    editorLibraryWrite("contentLibrary", library);
    return library;
  }

  function saveTemplate(type, template){
    var library = ensureEditorLibrary();
    if(!Array.isArray(library[type])) library[type] = [];
    library[type].push(template);
    editorLibraryWrite("contentLibrary", library);
    saveState();
  }

  function getTemplates(type){
    var library = ensureEditorLibrary();
    return library[type] || [];
  }

  window.saveTemplate = saveTemplate;
  window.getTemplates = getTemplates;

})();
