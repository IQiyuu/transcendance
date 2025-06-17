const Fastify = require('fastify');
const passport = require('@fastify/passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const secureSession = require('@fastify/secure-session');
const fs = require('fs');

const fastify = Fastify({ logger: true });

// Session sécurisée (utilise un fichier clé ou un Buffer secret)
fastify.register(secureSession, {
  key: fs.readFileSync('./secret-key'), // 32 bytes, voir ci-dessous
  cookie: {
    path: '/',
    secure: false // mettre à true en production (HTTPS)
  }
});

// Enregistrement de passport
fastify.register(passport.initialize());
fastify.register(passport.secureSession());

const GOOGLE_CLIENT_ID = 'TA_CLIENT_ID';
const GOOGLE_CLIENT_SECRET = 'TON_CLIENT_SECRET';

// Serialize/deserialize
passport.registerUserSerializer(async (user) => user);
passport.registerUserDeserializer(async (user) => user);

// Google strategy
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

// Routes
fastify.get('/', async (req, reply) => {
  if (req.user) {
    return `Bonjour ${req.user.displayName} <a href="/logout">Se déconnecter</a>`;
  } else {
    return '<a href="/auth/google">Se connecter avec Google</a>';
  }
});

fastify.get('/auth/google',
  { preValidation: passport.authenticate('google', { scope: ['profile', 'email'] }) },
  async (req, reply) => {}
);

fastify.get('/auth/google/callback',
  { preValidation: passport.authenticate('google', { failureRedirect: '/' }) },
  async (req, reply) => {
    reply.redirect('/');
  }
);

fastify.get('/logout', async (req, reply) => {
  await req.logout();
  reply.redirect('/');
});

// Lancer le serveur
fastify.listen({ port: 3000 }, (err, address) => {
  if (err) throw err;
  console.log(`🚀 Serveur lancé sur ${address}`);
});
