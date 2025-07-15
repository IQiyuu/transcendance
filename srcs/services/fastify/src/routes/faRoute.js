import speakeasy from 'speakeasy';

async function faRoute (fastify, options) {
  const secret = options.secretKey;

  // Verifie avec l API si le code est bon 
    fastify.post('/fa/2fa', async (req, reply) => {
      try {
        const token = req?.cookies?.tempo_token;
        if (token === undefined)
          return reply.send({success: false, error : "Token not found"});
        const decoded = fastify.jwt.verify(token, secret);
        if (decoded === null)
          return reply.send({success: false, error : "Decoded token not found"});
        const username = decoded.username;
        let userToken  = req?.body;
        if (userToken === undefined)
			    return reply.send({success: false, error : "User token not found"});
        const value = options.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
         const verified = speakeasy.totp.verify({
            secret: value.secret,
            encoding: 'base32',
            token: userToken,
            window: 1,
          });
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
            return reply.send({ twofa: 1, username : username});
          } else {
            return reply.send({ twofa: 0});
          }
        }
        catch (err)
        {
          console.error("Erreur 2FA :", err);
  return reply.send({ error: "Erreur interne lors de la vérification 2FA" });
        }
    
    });

    // On regarde si l utilisateur a active la 2fa via le cookie 
    fastify.get('/fa/check-2fa-status', async (req, reply) => {
        const token = req?.cookies?.auth_token;
        if (token === undefined)
          return reply.send({success: false, error : "errNoToken"});
        const decoded = fastify.jwt.verify(token, secret);
        if (decoded === undefined) 
          return reply.send({success: false, error : "errDecToken"});
        const username = decoded.username;
        if (username === undefined)
			    return reply.send({success: false, error : "errNoUser"});
        const value = options.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (value?.twofa_activate === 0)
          return reply.send({success: 0});
        else 
          return reply.send({success: 1});
    });

    // On regarde si l utilisateur a active la 2fa via le parametre mis en entree 
    fastify.post('/fa/check-2fa-status-in', async (req, reply) => {
      try {
            const username = req?.body?.username;
            if (username === undefined)
			        return reply.send({success: false, error : "Username not found"});
            const value = options.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
            if (value.twofa_activate === 0)
              return reply.send({success: 0});
            else 
              return reply.send({success: 1});
          }
          catch(err)
          {
            console.error(err);
            return reply.send({ error: "errServ" });
          }
    });

    // Active ou desactive la 2FA en changeans la valuer dans la db
    fastify.get('/fa/enable-2fa', async (req, reply) => {
    try {
        const token = req?.cookies?.auth_token;
        if (token === undefined)
          return reply.send({success: false, error : "errNoToken"});
        const decoded = fastify.jwt.verify(token, secret);
        if (decoded === null)
          return reply.send({success: false, error : "errDecToken"});
        const username = decoded.username;
        if (username === undefined)
			    return reply.send({success: false, error : "errNoUser"});
        const value = options.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!value) return reply.status(404).send({ error: "errNoUser" });

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
        return reply.send({ error: "errServ" });
    }
    });

    // cree un cookie temporaire  pour garder le username 
    fastify.post('/fa/set-user-cookie', async (req, reply) => {
        let username = req?.body;
        if (username === undefined)
			    return reply.send({success: false, error : "Username not found"});
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