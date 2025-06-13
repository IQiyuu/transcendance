const clientId = 'u-s4t2ud-35286bd3f00c601d663caf2387975ae7802bc026283c7cbe917483ea607f3f8e';
const redirectUri = 'https://k0r1p8.42mulhouse.fr:3000/callback';
const clientSecret = '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';

let username = null;

async function faRoute(fastify, options) {
  const secretKey = options.secretKey;

  async function compareLogin(login, options) {
    const utilisateur = options.db.prepare('SELECT twofa FROM users WHERE username = ?').run(username);
    if (utilisateur.twofa && utilisateur.twofa == login) {
      return true;
    }
    return false;
  }
  async function registerLogin(login, options) {
    const utilisateur = options.db.prepare('SELECT twofa FROM users WHERE username = ?').run(username);
    if (utilisateur.twofa !== null) {
      return false;
    }
    console.log("true");
    return true;
  }
  fastify.get('/2fa', async (req, reply) => {
    const client_UID = 'u-s4t2ud-35286bd3f00c601d663caf2387975ae7802bc026283c7cbe917483ea607f3f8e';
    const redirect_URI = 'https://k0r1p8.42mulhouse.fr:3000/callback'
    const authUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${client_UID}&redirect_uri=${redirect_URI}&response_type=code`;

    const token = req.cookies.auth_token;

    try {

        const decoded = fastify.jwt.verify(token, secretKey);
        username = decoded.username;
        console.log(username);
        return reply.redirect(authUrl);
    } catch (error) {
        return reply.send({ success: false });
    }
    
  });

  fastify.get('/callback', async (req, res) => {
    console.log("Obtention du token 2FA");
    const code = req.query.code;
    if (!code) 
      return res.status(400).send('Code d\'autorisation manquant.');

    try {

      const tokenResponse = await fetch('https://api.intra.42.fr/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code: code
        })
    });

    const tokenData = await tokenResponse.json();
    console.log("tokenData reçu :", tokenData);

    const accessToken = tokenData.access_token;

    const userResponse = await fetch('https://api.intra.42.fr/v2/me', {
  headers: {
    Authorization: `Bearer ${accessToken}`
  }
});


    const userData = await userResponse.json();
    const login = userData.login;

    console.log("Utilisateur connecté :", login);
    const value = await registerLogin(login, options);
    if (!value){
      const utilisateur = options.db.prepare('UPDATE users SET twofa = ? WHERE username = ?').run(login, username);
    }
    const value2 = await compareLogin(login, options);

    if (value2)
      return reply.send({ success: false, message: 'Pas le bon compte 2fa.' });
    res.type('text/html').send("<p>Authentification reussie, la page va se fermer dans 5 secondes</p><script>setTimeout(() => {window.close()}, 5000);</script>");
    //return reply.redirect('/success');
  } catch (error) {
    console.error('Erreur lors de l\'authentification :', error);
    return res.status(500).send('Erreur lors de l\'authentification.');
  }
});

} 
export default faRoute;