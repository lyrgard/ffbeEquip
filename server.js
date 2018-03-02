const fs = require('fs');
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const sessions = require('client-sessions');

const config = require('./config.js');
const drive = require('./server/routes/drive.js');
const links = require('./server/routes/links.js');
const oauth = require('./server/routes/oauth.js');
const corrections = require('./server/routes/corrections.js');
const errorHandler = require('./server/middlewares/boom.js');
const authRequired = require('./server/middlewares/oauth.js');

const app = express();
app.disable('x-powered-by');

app.use(express.static(path.join(__dirname, '/static/')));
if (config.isDev) {
  app.use(morgan('dev'));
}
app.use(sessions({
  cookieName: 'OAuthSession',
  secret: config.secret,
}));
app.use(bodyParser.json());

app.use('/', oauth);
app.use('/links', links);
app.use('/', corrections);
app.use('/', authRequired, drive);

// Basic 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found');
});

app.use(errorHandler);

if (module === require.main) {
  const server = app.listen(config.port, () => {
    console.log(`App server running at http://localhost:${config.port}`);
  });
}

module.exports = app;
