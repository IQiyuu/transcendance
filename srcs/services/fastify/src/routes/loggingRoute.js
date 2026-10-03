async function logginRoute (fastify, options) {
  const secretKey = options.secretKey;
  fastify.get('/', async (request, reply) => {
    return reply.view("index.ejs");
  })

  // Route pour s'inscrire, verifie que le username n'existe pas
  fastify.post('/register', async (request, reply) => {
    const { username, password } = request.body;
    // console.log("Données REGISTER reçues :", username, password);

    try {
      const userExists = options.db.prepare('SELECT * FROM users WHERE username = ?').get(username);

      if (userExists)
          return reply.code(409).send({ success: false, message: 'errReg' });
      
      const hash_pass = await fastify.bcrypt.hash(password);
      const insert = options.db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
      const result = insert.run(username, hash_pass);

      const token = fastify.jwt.sign({ username }, { expiresIn: '1d' });

      reply.setCookie('auth_token', token, {
        path: '/',
        httpOnly: true,
        secure: true,
        SameSite: 'Strict',
        maxAge: 86400,
      });
      
      return reply.code(201).send({
        success: true,
        message: `Welcome ${username}`,
        username: username,
        id: result.lastInsertRowid,
      });
    } catch (error) {
      console.log(error);
      return reply.code(500).send({ success: false, message: 'Error insert data in db.' });
    }
  });

  // Route pour se connecter verifier le username et password dans la db
  fastify.post('/login', async (request, reply) => {
    const { username, password } = request.body;
    // console.log("Données LOGIN reçues :", username, password);

    try {
        const user = options.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user)
            return reply.code(401).send({ success: false, message: 'errAuth' });

        const isMatch = await fastify.bcrypt.compare(password, user.password);

        if (!isMatch)
          return reply.code(401).send({ success: false, message: 'errAuth' });

        const token = fastify.jwt.sign({ username }, { expiresIn: '1d' });

        reply.setCookie('auth_token', token, {
          path: '/',
          httpOnly: true,
          secure: true,
          SameSite: 'Strict',
          maxAge: 86400,
        });


        return reply.code(200).send({ success: true, message: `Welcome ${username}`, username: username, id: user.user_id });

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
        if (decoded == null)
            throw Error("Cookie not recognized");
        request.user = decoded.username;
    } catch (error) {
        return reply.send({ success: false });
    }
  };


  fastify.post('/logout', {
    preHandler: isAuthenticated,
  }, async (req, rep) => {
    rep.clearCookie('auth_token');
    rep.send({success: true});
  });

  // Je sais plus mais c'est une route qui verifie si on est deja connecter
  fastify.get('/protected', {
    preHandler: isAuthenticated,
    }, async (request, reply) => {
        return reply.send({ success: true, username: request.user });
    });

}

export default logginRoute;