const path = require('path');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const sessions = require('client-sessions');
const helmet = require('helmet')

const config = require('./config.js');
const firebase = require('./server/routes/firebase.js');
const drive = require('./server/routes/drive.js');
const links = require('./server/routes/links.js');
const oauth = require('./server/routes/oauth.js');
const clientConfig = require('./server/routes/clientConfig.js');
const corrections = require('./server/routes/corrections.js');
const errorHandler = require('./server/middlewares/boom.js');
const authRequired = require('./server/middlewares/oauth.js');

const app = express();

// Helmet Middleware
app.use(helmet());

app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));
app.use(helmet.hsts({
  maxAge: 63072000, // 2 years
  includeSubDomains: true,
  preload: true
}));

var cspDirectives =  {
  defaultSrc: ["'none'"],
  scriptSrc: ["'self'", "'unsafe-inline'",
              'code.jquery.com', 'maxcdn.bootstrapcdn.com', 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'gitcdn.github.io', 'www.google-analytics.com'],
  styleSrc: ["'self'", "'unsafe-inline'",
             'code.jquery.com', 'maxcdn.bootstrapcdn.com', 'gitcdn.github.io'],
  imgSrc: ["'self'", 'data:', 'www.google-analytics.com', 'code.jquery.com'],
  fontSrc: ["'self'", 'maxcdn.bootstrapcdn.com', 'fonts.gstatic.com'],
  connectSrc: ["'self'", 'www.google-analytics.com'],
  mediaSrc: ["'none'"],
  objectSrc: ["'none'"],
  childSrc: ["'self'"],
  workerSrc: ["'self'"],
  frameSrc: ["'none'"],
  frameAncestors: ["'none'"],
  formAction: ["'self'"],
  reportUri: 'https://ffbeequip.report-uri.com/r/d/csp/reportOnly',
  blockAllMixedContent: !config.isDev,
  upgradeInsecureRequests: !config.isDev
};

app.use(helmet.contentSecurityPolicy({ directives: cspDirectives, reportOnly: !config.isDev }));

// Middlewares
app.use(express.static(path.join(__dirname, '/static/')));
if (config.isDev) {
  app.use(morgan('dev'));
}
app.use(sessions({
  cookieName: 'OAuthSession',
  secret: config.secret,
  duration: 7 * 24 * 60 * 60 * 1000
}));
app.use(bodyParser.json());

// Routes
app.use('/', oauth);
app.use('/clientConfig', clientConfig);
app.use('/links', links);
app.use('/', corrections);
app.use('/', firebase.unAuthenticatedRoute);
app.use('/', authRequired, firebase.authenticatedRoute, drive);

// Basic 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found');
});

app.use(errorHandler);

if (module === require.main) {
  app.listen(config.port, () => {
    console.log(`App server running at http://localhost:${config.port}`);
  });
}

module.exports = app;
