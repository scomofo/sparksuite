(function(){

  async function loginSpark(email, password){
    var data = await sparkApiRequest("/api/auth/login", "POST", {
      email: email,
      password: password
    });
    S.cloudAuth = {
      userId: data.userId,
      email: data.email,
      token: data.token,
      loggedIn: true
    };
    saveState();
    return true;
  }

  function logoutSpark(){
    S.cloudAuth = {
      userId: null,
      email: null,
      token: null,
      loggedIn: false
    };
    saveState();
  }

  function isLoggedInSpark(){
    return !!(S.cloudAuth && S.cloudAuth.loggedIn && S.cloudAuth.token);
  }

  window.loginSpark = loginSpark;
  window.logoutSpark = logoutSpark;
  window.isLoggedInSpark = isLoggedInSpark;

})();
