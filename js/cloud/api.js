(function(){

  function getCloudAuthToken() {
    if (typeof SparkState !== "undefined" && typeof SparkState.read === "function") {
      return SparkState.read(["cloudAuth", "token"], "");
    }
    return "";
  }

  async function sparkApiRequest(path, method, body){
    var headers = {
      "Content-Type": "application/json"
    };
    var token = getCloudAuthToken();
    if(token){
      headers["Authorization"] = "Bearer " + token;
    }
    var res = await fetch(path, {
      method: method || "GET",
      headers: headers,
      body: body ? JSON.stringify(body) : undefined
    });
    if(!res.ok){
      throw new Error("API request failed: " + res.status);
    }
    return await res.json();
  }

  window.sparkApiRequest = sparkApiRequest;

})();
