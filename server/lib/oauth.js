const google = require('googleapis');
const config = require('../config.js');

const { OAuth2 } = google.auth;

const createClient = (tokens) => {
  const OAuth2Client = new OAuth2(
    config.googleOAuthCredential.web.client_id,
    config.googleOAuthCredential.web.client_secret,
    config.googleOAuthCredential.web.redirect_uris[0],
  );

  if (tokens) {
    OAuth2Client.setCredentials(tokens);
  }

  return OAuth2Client;
};

module.exports = {
  createClient,
};
