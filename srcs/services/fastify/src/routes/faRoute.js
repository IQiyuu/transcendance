

let username = null;
async function faRoute(fastify, options) {
  fastify.get('/2fa', async (req, reply) => {
    const secretKey = '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';
    const clientId = '991272817830-b5g9dhidimfed8nu4d5e9sjcjumr2hnm.apps.googleusercontent.com';
    const redirectUri = 'https://k0r4p2.42mulhouse.fr:3000/callback';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile`;

    const token = req.cookies.auth_token;
    try {
      const decoded = fastify.jwt.verify(token, secretKey);
      username = decoded.username;
      return reply.redirect(authUrl);
    } catch (error) {
      return reply.send({ success: false });
    }
  });

fastify.get('/callback', async (req, reply) => {
  const code = req.query.code;
  if (!code) return reply.status(400).send("Code manquant");

 const clientId = '991272817830-b5g9dhidimfed8nu4d5e9sjcjumr2hnm.apps.googleusercontent.com';
  const redirectUri = 'https://k0r4p2.42mulhouse.fr:3000/callback';
  const clientSecret = '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';

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

    console.log("Utilisateur Google connecté :", email);


  const value = options.db.prepare('SELECT twofa FROM users WHERE username = ?').get(username);
    console.log(value.twofa);
    if (value.twofa == null){
      options.db.prepare('UPDATE users SET twofa = ? WHERE username = ?').run(email, username);
      reply.type('text/html').send("<p>Authentification Google réussie. Cette fenêtre va se fermer dans 5 secondes.</p><script>setTimeout(() => {window.close()}, 5000);</script>");
    }
    if (value.twofa !== email)
      return reply.send({ success: false, message: 'Pas le bon compte 2fa.' });

    reply.type('text/html').send("<p>Authentification Google réussie. Cette fenêtre va se fermer dans 5 secondes.</p><script>setTimeout(() => {window.close()}, 5000);</script>");
  } catch (error) {
    console.error("Erreur Google OAuth :", error);
    return reply.status(500).send("Erreur lors de l'authentification.");
  }
});


} 
export default faRoute;