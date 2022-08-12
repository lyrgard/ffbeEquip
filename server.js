import path from 'path'
import express from 'express'
import bodyParser from 'body-parser';
import sessions from 'client-sessions';
import helmet from 'helmet'
import mime from 'mime'
import cors from 'cors'
import ServerConfig from './config.js'
import { route as corrections } from './server/routes/corrections.js';
import { route as clientConfig } from './server/routes/clientConfig.js';
import { route as oauth } from './server/routes/oauth.js'
import { route as unitSkills } from './server/routes/unitSkills.js'
import * as firebase from './server/routes/firebase.js';
import { OAuthFunction as authRequired } from './server/middlewares/oauth.js';
import { route as drive } from './server/routes/drive.js';
import { boomJS as errorHandler } from './server/middlewares/boom.js';
import { fileURLToPath } from 'url';
import esMain from 'es-main';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let config = ServerConfig.ServerConfig;

const app = express();

console.log(`Environment is: ${config.env}`);


if (config.google.enabled) {
  app.use('/', authRequired, drive);
}

// Helmet Middleware
app.use(helmet.frameguard({
  action: "deny"
}));

app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));
app.use(helmet.hsts({
  maxAge: 63072000, // 2 years
  includeSubDomains: true,
  preload: true,
}));

let corsOptions = {
  origin: 'https://www.ffbeequipnext.com',
}
if (!config.isProd && process.env.DEV_USE_DIST != "yes") {
    corsOptions.origin = [corsOptions.origin, 'http://localhost:4444', 'http://localhost:3001'];
}
console.log("Config is not Production and DEV_USE_DIST is no: ");
console.log(!config.isProd && process.env.DEV_USE_DIST != "yes");
console.log(corsOptions);

app.use(cors(corsOptions));

app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')))
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')))
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')))

var cspDirectives = {
  "default-src": ["'self'"],
  "script-src": ["'self'",'code.jquery.com', 'cdn.jsdelivr.net', 'maxcdn.bootstrapcdn.com', 'cdnjs.cloudflare.com', 'gitcdn.github.io', 'www.google-analytics.com', 'kit.fontawesome.com', 'ka-f.fontawesome.com', "'unsafe-inline'"],
  "script-src-attr": ["'unsafe-inline'"],
  "style-src": ["'self'",'code.jquery.com', 'gitcdn.github.io', 'cdnjs.cloudflare.com', 'kit-free.fontawesome.com', 'cdn.jsdelivr.net', 'maxcdn.bootstrapcdn.com', "'unsafe-inline'"],
  "img-src": ["'self'", 'data:', 'blob:', 'content:', 'www.google-analytics.com', 'code.jquery.com', 'ffbeequip.com', 'cdn.jsdelivr.net'],
  "font-src": ["'self'", 'fonts.gstatic.com', 'kit-free.fontawesome.com', 'ka-f.fontawesome.com', 'maxcdn.bootstrapcdn.com'],
  "connect-src": ["'self'", 'www.google-analytics.com', 'firebasestorage.googleapis.com', 'https://api.github.com', 'https://discordapp.com', 'https://api.imgur.com/3/image', 'https://ka-f.fontawesome.com'],
  "media-src": ["'none'"],
  "object-src": ["'none'"],
  "child-src": ["'self'"],
  "worker-src": ["'self'"],
  "frame-src": ["'self'"],
  "formAction": ["'self'"],
  "blockAllMixedContent": [],
  "reportUri": 'https://ffbeequipnext.report-uri.com/r/d/csp/reportOnly',
};

// In development, do not report
if (config.isDev) {
  delete cspDirectives.reportUri;
}

app.use(helmet.contentSecurityPolicy({ 
  directives: cspDirectives, 
  reportOnly: !config.isDev 
}));

// Static middleware
if (config.isProd || process.env.DEV_USE_DIST === "yes") {
  console.log(`App is also serving dist`);
  // In prod, also serve dist folder (which contains the webpack generated files)
  // Any files present in 'dist' will shadow files in 'static'
  app.use(express.static(path.join(__dirname, '/dist/'), {
    etag: false,
    lastModified: config.isProd,
    cacheControl: config.isProd,
    maxAge: "365d",
    immutable: config.isProd,
    index: 'homepage.html',
    setHeaders: function (res, path) {
      if (mime.lookup(path) === 'text/html') {
        // For HTML, avoid long and immutable cache since it can't be busted
        res.setHeader('Cache-Control', 'public, max-age=0');
      }
    }
  }));
}

// Static middleware 
// Serve static files directly
// Cache related headers are disabled in dev
app.use(express.static(path.join(__dirname, '/static/'), {
  etag: false,
  cacheControl: config.isProd,
  lastModified: config.isProd,
  maxAge: "1h",
  index: 'homepage.html',
  setHeaders: function (res, path) {
    if (mime.getType(path) === 'application/json') {
      // For JSON, avoid caching
      res.setHeader('Cache-Control', 'public, max-age=0');
    }
  }
}));

app.use(sessions({
  cookieName: 'OAuthSession',
  secret: config.secret,
  duration: 7 * 24 * 60 * 60 * 1000,
}));
app.use(bodyParser.json({'limit':'1mb'}));

// Routes
app.use('/clientConfig', clientConfig);
if (config.google.enabled) {
    app.use('/', oauth);
}
app.use('/', corrections, unitSkills);
if (config.firebase.enabled) {
    console.log("Firebase is enabled.")
    app.use('/', firebase.unAuthenticatedRoute);
    app.use('/', authRequired, firebase.authenticatedRoute);
}


// Old index.html file no longer exists
// Redirect users to homepage
app.get('/index.html', function(req, res) {
  res.redirect(301, '/');
});

// Basic 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found');
});

app.use(errorHandler);

if (process.env.PORT) {
    config.port = process.env.PORT;
}

if (esMain(import.meta)) {
  app.listen(config.port, () => {
    console.log(`App server running at http://localhost:${config.port}`);
  });
}

export default { app }
