import speakeasy from 'speakeasy';

async function faRoute (fastify, options) {
  const secret = options.secretKey;

    fastify.post('/2fa', async (req, reply) => {
      try {
        const token = req.cookies.tempo_token;
        const decoded = fastify.jwt.verify(token, secret);
        const username = decoded.username;
        const { userToken } = req.body;
        const value = options.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
         const verified = speakeasy.totp.verify({
            secret: value.secret,
            encoding: 'base32',
            token: userToken,
            window: 1,
          });
          console.log(verified);
          if (verified) {
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
            reply.clearCookie('tempo_token');
            return reply.send({ twofa: 1});
          } else {
            return reply.send({ twofa: 0});
          }
        }
        catch (err)
        {
          console.error("Erreur 2FA :", err);
  return reply.status(500).send({ error: "Erreur interne lors de la vérification 2FA" });
        }
    
    });

    fastify.get('/check-2fa-status', async (req, reply) => {
        const token = req.cookies.auth_token;
        const decoded = fastify.jwt.verify(token, secret);
        const username = decoded.username;
        const value = options.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (value.twofa_activate === 0)
          return reply.send({success: 0});
        else 
          return reply.send({success: 1});
    });


    fastify.post('/check-2fa-status-in', async (req, reply) => {
      try {
            const { username } = req.body;
            const value = options.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
            if (value.twofa_activate === 0)
              return reply.send({success: 0});
            else 
              return reply.send({success: 1});
          }
          catch(err)
          {
            console.error(err);
            return reply.status(500).send({ error: 'Erreur serveur' });
          }
    });


    fastify.get('/enable-2fa', async (req, reply) => {
    try {
        const token = req.cookies.auth_token;
        const decoded = fastify.jwt.verify(token, secret);
        const username = decoded.username;

        const value = options.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!value) return reply.status(404).send({ error: 'Utilisateur introuvable' });

        let newStatus;
        if (value.twofa_activate === 0) {
        options.db.prepare('UPDATE users SET twofa_activate = ? WHERE username = ?').run(1, username);
        newStatus = 1;
        } else {
        options.db.prepare('UPDATE users SET twofa_activate = ? WHERE username = ?').run(0, username);
        newStatus = 0;
        }

        const updatedUser = options.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        return reply.send({ twofa: updatedUser.twofa, twofa_activate: newStatus });
    } catch (err) {
        console.error(err);
        return reply.status(500).send({ error: 'Erreur serveur' });
    }
    });
    fastify.post('/set-user-cookie', async (req, reply) => {
        const { username } = req.body;
        const payload = {
              username: username,
            };
            const token = fastify.jwt.sign(payload, { expiresIn: '1d' });

            reply.setCookie('tempo_token', token, {
              path: '/',
              httpOnly: true,
              secure: true,
              SameSite: 'Strict',
              maxAge: 3600,
            });
    });

}
export default faRoute;