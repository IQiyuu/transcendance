async function logginRoute (fastify, options) {
  const secretKey = options.secretKey;
  fastify.get('/', async (request, reply) => {
    return reply.view("src/index.ejs");
  })

  // Route pour s'inscrire, verifie que le username n'existe pas
  fastify.post('/register', async (request, reply) => {
    const { username, password } = request.body;
    console.log("Données REGISTER reçues :", username, password);

    try {
      const userExists = options.db.prepare('SELECT * FROM users WHERE username = ?').get(username);

      if (userExists) {
        return { success: false, message: 'Username already used' };
      }
      const hash_pass = await fastify.bcrypt.hash(password);
      const insert = options.db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
      insert.run(username, hash_pass);

      console.log(`User '${username}' added to db`);

      const payload = {
        username: username,
      };

      const token = fastify.jwt.sign(payload, secretKey, { expiresIn: '1d' });

      reply.setCookie('auth_token', token, {
        path: '/',
        httpOnly: true,
        secure: true,
        SameSite: 'Strict',
        maxAge: 86400000,
      });
      
      return { success: true, message: `Welcome ${username}` };
    } catch (error) {
      console.error('Error insert data in db.', error);
      return { success: false, message: 'Error insert data in db.' };
    }
  });

  // Route pour se connecter verifier le username et password dans la db
  fastify.post('/login', async (request, reply) => {
    const { username, password } = request.body;
    console.log("Données LOGIN reçues :", username, password);

    try {
        const user = options.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user) {
            return reply.send({ success: false, message: 'Wrong username or password.' });
        }

        const isMatch = await fastify.bcrypt.compare(password, user.password);

        if (!isMatch) {
            return reply.send({ success: false, message: 'Wrong username or password.' });
        }

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


        return { success: true, message: `Welcome ${username}`, username: username };

    } catch (error) {
      console.log("error: ", error);
        return reply.code(500).send({ success: false, message: 'Error.' });
    }
  });

  // Verifie si on est authentifie
  const isAuthenticated = async (request, reply) => {
    const token = request.cookies.auth_token;

    if (!token) {
        return reply.send({ success: false });
    }

    try {
        const decoded = fastify.jwt.verify(token, secretKey);
        request.user = decoded.username;
    } catch (error) {
        return reply.send({ success: false });
    }
  };

  // Je sais plus mais c'est une route qui verifie si on est deja connecter
  fastify.get('/protected', {
    preHandler: isAuthenticated,
    }, async (request, reply) => {
        return reply.send({ success: true, username: request.user });
    });

}

export default logginRoute;