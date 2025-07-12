import qrcode from 'qrcode';
import speakeasy from 'speakeasy';

import {isClientAlreadyConnected} from './webSocketRoute.js'


async function logginRoute (fastify, options) {
	const secretKey = options.secretKey;
	fastify.get('/', async (request, reply) => {
		return reply.view("src/index.ejs");
	})

	function isValidPassword(password) {
		const minLength    = password.length >= 8;
		const maxLength    = password.length <= 42;
		const hasUppercase = /[A-Z]/.test(password);
		const hasLowercase = /[a-z]/.test(password);
		const hasDigit     = /[0-9]/.test(password);
		const hasSpecial   = /[!@#$%^&*(),.?":{}|<>]/.test(password);

		return minLength && maxLength && hasUppercase && hasLowercase && hasDigit && hasSpecial;
	}

	async function isValidUsername(username) {
			const minLength    = username.length >= 3;
			const maxLength    = username.length <= 15;
			const hasSpecial   = /[!@#$%^&*(),.?":{}|<>]/.test(username);

			return minLength && maxLength && !hasSpecial;
	}

	// Route pour s'inscrire, verifie que le username n'existe pas
	fastify.post('/register', async (request, reply) => {
		const { username, password } = request.body;
		try {
			if (!isValidPassword(password))
				throw Error("errMdp");
			if (!(await isValidUsername(username)))
				throw Error("errUname");
		} catch (error) {
			// console.error("Erreur : ", error);
			return { success: false, message: error.message };
		}
		
		try {
			const userExists = options.db.prepare('SELECT * FROM users WHERE username = ?').get(username);

			if (userExists) {
				return { success: false, message: 'errReg' };
			}
			const hash_pass = await fastify.bcrypt.hash(password);
			const insert = options.db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
			insert.run(username, hash_pass);

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

			const secret = speakeasy.generateSecret({ name: 'Transcendance 2FA' }); 
			options.db.prepare('UPDATE users SET secret = ? WHERE username = ?').run(secret.base32, username);
			qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
				if (err) throw err;
				options.db.prepare('UPDATE users SET twofa = ? WHERE username = ?').run(data_url, username);
			});
			return { success: true, message: `Welcome ${username}`, username: username };
		} catch (error) {
			console.error('Error insert data in db.', error);
			return { success: false, message: 'Error insert data in db.' };
		}
	});

	// Route pour se connecter verifier le username et password dans la db
	fastify.post('/login', async (request, reply) => {
		const { username, password } = request.body;
		// console.log("Données LOGIN reçues :", username, password);

		try {
				const user = options.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
				if (!user) {
						return reply.send({ success: false, message: 'errAuth' });
				}

				const isMatch = await fastify.bcrypt.compare(password, user.password);

				if (!isMatch) {
						return reply.send({ success: false, message: 'errAuth' });
				}

				if (!isValidPassword(password))
				{
					return reply.send({ success: false, message: 'errExpired' });
				}

				if (isClientAlreadyConnected(username)){
					return reply.send({success : false, message: 'errAlreadyLogged'})
				}
				
				const value = options.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
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

				return { success: true, message: `Welcome ${username}`, username: username };

		} catch (error) {
			// console.log("error: ", error);
			return reply.code(500).send({ success: false, message: 'Error.' });
		}
	});

	// Verifie si on est authentifie
	const isAuthenticated = async (request, reply) => {
		const token = request.cookies.auth_token;

		if (token === undefined || token === null)
				return reply.send({ success: false, error: "" });
		try {
				const decoded = fastify.jwt.verify(token, secretKey);
				if (decoded == null)
						throw Error("Wrong cookie");
				try {
					const user = options.db.prepare('SELECT username FROM users WHERE username = ?').get(decoded.username);
					if (!user)
						throw Error("Wrong cookie");
					request.user = decoded.username;
				} catch (error) {
					reply.clearCookie('auth_token');
					return reply.send({ success: false, error: error.message });
				}
		} catch (error) {
				reply.clearCookie('auth_token');
				return reply.send({ success: false, error: error.message });
		}
	};

	// logout route
	fastify.post('/logout', {
		preHandler: isAuthenticated,
	}, async (req, rep) => {
		rep.clearCookie('auth_token');
		rep.send({success: true});
	});

	// Check whether the user is connected
	fastify.get('/protected', {
		preHandler: isAuthenticated,
		}, async (request, reply) => {
				return reply.send({ success: true, username: request.user});
		});

}

export default logginRoute;