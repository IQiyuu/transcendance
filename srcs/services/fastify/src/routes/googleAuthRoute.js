

let username = null;
async function GoogleAuthRoute(fastify, options) {
  const secret = options.secretKey;
  const clientId = options.client;
  const clientSecret = options.secretClient;
  const redirectUri = options.redirectionUri;
  const redirectUri2 = options.redirectionUri2;
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile`;
  const authUrl2 = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri2}&response_type=code&scope=openid%20email%20profile`;
  
  // route principale pour ajouter google auth

  fastify.get('/google-auth', async (req, reply) => {

    const token = req.cookies.auth_token;
    const googleEmail = req.cookies.google_email;
    try {
      const decoded = fastify.jwt.verify(token, secret);
      username = decoded.username;
      if (!googleEmail)
        return reply.redirect(authUrl);
      else 
      {
        const value = options.db.prepare('SELECT twofa FROM users WHERE username = ?').get(username);
        if (value.twofa == null){
          options.db.prepare('UPDATE users SET twofa = ? WHERE username = ?').run(googleEmail, username);
          reply.type('text/html').send("<p>Authentification Google reussie. Cette fenetre va se fermer dans 5 secondes.</p><script>setTimeout(() => {window.close()}, 5000);</script>");
        }
       reply.type('text/html').send("<p>Google Authentificator est deja active. Cette fenetre va se fermer dans 5 secondes.</p><script>setTimeout(() => {window.close()}, 5000);</script>");
      }
    } catch (error) {
      return reply.send({ success: false });
    }
  });

  // route principale pour enlever google auth

  fastify.get('/desable_auth', async (req, reply) => {
  try {
    const token = req.cookies.auth_token;
    const decoded = fastify.jwt.verify(token, secret);
    const username = decoded.username;
    options.db.prepare('UPDATE users SET twofa = ? WHERE username = ?').run(null, username);
    reply.clearCookie('google_email');

    return reply.send({ success: true, message: "2FA désactivé" });
  } catch (error) {
    console.error("Erreur dans /desable_auth :", error);
    return reply.status(500).send({ success: false, message: "Erreur serveur" });
  }
});


  // route principale pour se connecter avec google authentificator 

  fastify.get('/check', async (req, reply) => {
    const token = req.cookies.auth_token;
    const googleEmail = req.cookies.google_email;

    try 
    {
      if (!googleEmail)
        return reply.redirect(authUrl2);
      const value = options.db.prepare('SELECT * FROM users WHERE twofa = ?').get(googleEmail);
      if (value)
      {
        console.log("Lance le projet tabanak");

      }
    } catch (error) {
      return reply.send({ success: false });
    }
  });
 
// callback de google auth pour ajouter l email a la db et pouvoir se connecter avec google auth 

fastify.get('/callback', async (req, reply) => {
    const code = req.query.code;
    if (!code) 
      return reply.status(400).send("Code manquant");

      try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
          })
        });
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        const idToken = tokenData.id_token;

        const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        const userData = await userResponse.json();
        const email = userData.email;
        const name = userData.name;
        const sub = userData.sub;

        reply.setCookie('google_email', email, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: true,
      path: '/'
    });

    return reply.redirect('/google-auth');

  } catch (error) {
    console.error("Erreur Google OAuth :", error);
    return reply.status(500).send("Erreur lors de l'authentification.");
  }
});

// callback de google auth pour ajouter l email a la db et pouvoir se connecter avec google auth 

fastify.get('/callback2', async (req, reply) => {
  const code = req.query.code;
  if (!code) 
    return reply.status(400).send("Code manquant");
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri2,
        grant_type: 'authorization_code'
      })
    });
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const idToken = tokenData.id_token;

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const userData = await userResponse.json();
    const email = userData.email;
    const name = userData.name;
    const sub = userData.sub;


    reply.setCookie('google_email', email, {
  httpOnly: true,
  sameSite: 'Lax',
  secure: true,
  path: '/'
});

return reply.redirect('/check');

  } catch (error) {
    console.error("Erreur Google OAuth :", error);
    return reply.status(500).send("Erreur lors de l'authentification.");
  }
});

}
export default GoogleAuthRoute;