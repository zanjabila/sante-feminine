(function () {
  'use strict';

  const TOKEN_KEY = 'sf_access_token';
  const REFRESH_KEY = 'sf_refresh_token';

  function save(auth) {
    if (!auth || !auth.access_token) return;
    sessionStorage.setItem(TOKEN_KEY, auth.access_token);
    if (auth.refresh_token) sessionStorage.setItem(REFRESH_KEY, auth.refresh_token);
    // Nettoyage des anciens noms utilisés par les premières versions.
    sessionStorage.removeItem('sb_token');
  }

  function clear() {
    [TOKEN_KEY, REFRESH_KEY, 'sb_token', 'patiente', 'doctorAuth', 'adminAuth']
      .forEach((key) => sessionStorage.removeItem(key));
  }

  function token() {
    return sessionStorage.getItem(TOKEN_KEY) || sessionStorage.getItem('sb_token');
  }

  async function user(url, anonKey) {
    const accessToken = token();
    if (!accessToken) return null;
    const response = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) {
      clear();
      return null;
    }
    return response.json();
  }

  async function signOut(url, anonKey) {
    const accessToken = token();
    try {
      if (accessToken) {
        await fetch(`${url}/auth/v1/logout`, {
          method: 'POST',
          headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` }
        });
      }
    } finally {
      clear();
    }
  }

  window.SFSession = { save, clear, token, user, signOut };
})();
