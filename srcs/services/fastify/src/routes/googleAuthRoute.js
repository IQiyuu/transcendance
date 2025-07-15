import qrcode from 'qrcode';
import speakeasy from 'speakeasy';

let username = null;
async function GoogleAuthRoute(fastify, options) {
  let index = 0;

  const secret = options.secretKey;
  const clientId = options.client;
  const clientSecret = options.secretClient;
  const redirectUri = options.redirectionUri;
  const redirectUri2 = options.redirectionUri2;
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile`;
  const authUrl2 = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri2}&response_type=code&scope=openid%20email%20profile`;
  
  // Route used for google sign in
  fastify.get('/google/google-auth', async (req, reply) => {
    const token = req?.cookies?.auth_token;
    if (token === undefined)
      return reply.send ({success: 0});
    const googleEmail = req?.cookies.google_email;
    try {
      const decoded = fastify.jwt.verify(token, secret);
      if (decoded === undefined)
        return reply.send ({success: 0});
      username = decoded.username;
      if (!googleEmail)
        return reply.redirect(authUrl);
      else 
      {
        const value = options.db.prepare('SELECT email FROM users WHERE username = ?').get(username);
        const value2 = options.db.prepare('SELECT username FROM users WHERE email = ?').get(googleEmail);
        if (value2 != undefined)
        {
          reply.type('text/html').send("<p>Ce mail est deja active sur un autre compte. Cette fenetre va se fermer dans 5 secondes.</p><script>setTimeout(() => {window.close()}, 5000);</script>");
          return reply.send({ success: false });
        }
        if (value.email == null){
          options.db.prepare('UPDATE users SET email = ? WHERE username = ?').run(googleEmail, username);
          reply.type('text/html').send("<p>Authentification Google reussie. Cette fenetre va se fermer dans 5 secondes.</p><script>setTimeout(() => {window.close()}, 5000);</script>");
          return reply.send({ success: true });
        }
        reply.clearCookie('google_email');
        reply.type('text/html').send("<p>Google Authentificator est deja active. Cette fenetre va se fermer dans 5 secondes.</p><script>setTimeout(() => {window.close()}, 5000);</script>");
        return reply.send({ success: false });
      }
    } catch (error) {
      reply.type('text/html').send("<p>Erreur avec Google Authentificator. Cette fenetre va se fermer dans 5 secondes.</p><script>setTimeout(() => {window.close()}, 5000);</script>");
      return reply.send({ success: false });
    }
  });

  // route principale pour enlever google auth

  fastify.get('/google/desable_auth', async (req, reply) => {
  try {
    const token = req?.cookies?.auth_token;
    if (token === undefined)
      return reply.send ({success: 0});
    const decoded = fastify.jwt.verify(token, secret);
    if (decoded === null)
      return reply.send ({success: 0});
    const username = decoded.username;
    if(username === undefined)
      return reply.send ({success: 0});
    options.db.prepare('UPDATE users SET email = ? WHERE username = ?').run(null, username);

    return reply.send({ success: true, message: "2FA désactivé" });
  } catch (error) {
    console.error("Erreur Google OAuth :", error);
    return reply.status(500).send({ success: false, message: "Erreur serveur" });
  }
  });

  // route principale pour se connecter avec google authentificator 
  fastify.get('/google/check', async (req, reply) => {
    const token = req?.cookies?.auth_token;
    const googleEmail = req?.cookies?.google_email;

    try 
    {
      if (!googleEmail)
        return reply.redirect(authUrl2);
      const value = options.db.prepare('SELECT * FROM users WHERE email = ?').get(googleEmail);
      if (value)
      {
        const username = value.username;
        if (value.twofa_activate == 0)
        {
          const payload = {
            username: username,
          };
          const token = fastify.jwt.sign(payload, { expiresIn: '1d' });

          reply.setCookie('auth_token', token, {
            path: '/',
            httpOnly: true,
            secure: true,
            
            SameSite: 'Strict',
            maxAge: 3600,
          });
      }
        return reply.type('text/html').send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ username: "${username}", success: true }, window.location.origin);
              window.close();
            </script>
            <p>Connexion en cours...</p>
          </body>
        </html>
      `);
      }
      let guess = null;
      let tmp = null;
      while (true) {
        guess = `guess${index}`;
        tmp = options.db.prepare('SELECT * FROM users WHERE username = ?').get(guess);
        if (!tmp) 
          break;
        index++;
      }
      const hash_pass = await fastify.bcrypt.hash("default");
      const insert = options.db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
      insert.run(guess, hash_pass);
      options.db.prepare('UPDATE users SET email = ? WHERE username = ?').run(googleEmail, guess);
      const secret = speakeasy.generateSecret({ name: 'Transcendance 2FA' }); 
        options.db.prepare('UPDATE users SET secret = ? WHERE username = ?').run(secret.base32, guess);
        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
          if (err) throw err;
          options.db.prepare('UPDATE users SET twofa = ? WHERE username = ?').run(data_url, guess);
      });
  
      const payload = {
          username: guess,
      };
      const token = fastify.jwt.sign(payload, { expiresIn: '1d' });

      reply.setCookie('auth_token', token, {
        path: '/',
        httpOnly: true,
        secure: true,
        SameSite: 'Strict',
        maxAge: 3600,
      });
      return reply.type('text/html').send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ username: "${guess}", success: true }, window.location.origin);
              window.close();
            </script>
            <p>Connexion en cours...</p>
          </body>
        </html>
      `);
    } catch (error) {
      return reply.send({ success: false });
    }
  });
 
// callback de google auth pour ajouter l email a la db et pouvoir se connecter avec google auth 

fastify.get('/google/callback', async (req, reply) => {
    const code = req?.query.code;
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
        if (token === undefined)
      return reply.send ({success: 0});
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
    return reply.redirect('/google/google-auth');
  } catch (error) {
    console.error("Erreur Google OAuth :", error);
    return reply.status(500).send("Erreur lors de l'authentification.");
  }
});

// callback de google auth pour ajouter l email a la db et pouvoir se connecter avec google auth 

fastify.get('/google/callback2', async (req, reply) => {
  const code = req?.query.code;
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

return reply.redirect('/google/check');

  } catch (error) {
    console.error("Erreur Google OAuth :", error);
    return reply.status(500).send("Erreur lors de l'authentification.");
  }
});
// Fonction pour voir si le username via le cookie a un mail dans la db
fastify.get('/google/check-email-status', async (req, reply) => {
        const token = req?.cookies?.auth_token;
        if (token === undefined)
          return reply.send({success: false, error : "Token not found"});
        const decoded = fastify.jwt.verify(token, secret);
        if (decoded === undefined) 
          return reply.send({success: false, error : "Decoded token not found"});
        const username = decoded.username;
        if (username === undefined)
          return reply.send({success: false, error : "Username not found"});
        const value = options.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (value.email === undefined)
          return reply.send({success: false});
        else 
          return reply.send({success: true});
});


}
export default GoogleAuthRoute;