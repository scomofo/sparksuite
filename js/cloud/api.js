(function(){

  async function sparkApiRequest(path, method, body){
    var headers = {
      "Content-Type": "application/json"
    };
    if(S.cloudAuth && S.cloudAuth.token){
      headers["Authorization"] = "Bearer " + S.cloudAuth.token;
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
