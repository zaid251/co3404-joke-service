// src/server.js — Moderate Microservice Entry Point
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const session    = require('express-session');
const { auth }   = require('express-openid-connect');
const swaggerUi  = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const mq         = require('./messaging/rabbitmq');

const app  = express();
const PORT = process.env.PORT || 3003;

// ── Auth0 OIDC Configuration ──────────────────────────────────────────────────
const authConfig = {
  authRequired:  false,      // we manually protect routes
  auth0Logout:   true,
  secret:        process.env.SESSION_SECRET,
  baseURL:       process.env.BASE_URL       || `http://localhost:${PORT}`,
  clientID:      process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
};

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Session needed for OIDC state
app.use(session({
  secret:            process.env.SESSION_SECRET || 'fallback-secret',
  resave:            false,
  saveUninitialized: false,
  cookie:            { secure: false } // set true when using HTTPS
}));

// Mount Auth0 OIDC middleware
app.use(auth(authConfig));

// ── OpenAPI Docs (public) ─────────────────────────────────────────────────────
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { background-color: #1a1a2e; }',
  customSiteTitle: 'Moderate Service API Docs'
}));

// ── Health check (public) ─────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:        'healthy',
    service:       'moderate-service',
    authenticated: req.oidc?.isAuthenticated() || false,
    queue:         mq.getStatus() ? 'connected' : 'disconnected',
    timestamp:     new Date().toISOString()
  });
});

// ── Auth routes (handled automatically by express-openid-connect) ─────────────
// GET /login  → redirects to Auth0
// GET /logout → logs out
// GET /callback → Auth0 redirects here after login

// ── User info endpoint ────────────────────────────────────────────────────────
app.get('/me', (req, res) => {
  if (!req.oidc.isAuthenticated()) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({
    authenticated: true,
    user: {
      name:    req.oidc.user.name,
      email:   req.oidc.user.email,
      picture: req.oidc.user.picture
    }
  });
});

// ── Protected routes ──────────────────────────────────────────────────────────
app.use('/', require('./routes/moderate'));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Moderate Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Startup ───────────────────────────────────────────────────────────────────
async function start() {
  try {
    await mq.connectWithRetry();

    app.listen(PORT, () => {
      console.log(`[Moderate Service] Running on port ${PORT}`);
      console.log(`[Moderate Service] UI:   http://localhost:${PORT}`);
      console.log(`[Moderate Service] Docs: http://localhost:${PORT}/docs`);
      console.log(`[Moderate Service] Login: http://localhost:${PORT}/login`);
    });
  } catch (err) {
    console.error('[Moderate Service] Fatal startup error:', err.message);
    process.exit(1);
  }
}

start();
