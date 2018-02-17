const { google } = require('googleapis');
const config = require('../../config.js');

const { OAuth2 } = google.auth;

/**
 * @summary Create a Google OAuth2 client
 * @param {Object} tokens - User OAuth tokens
 * @returns {OAuth2}
 */
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

const client = createClient();
const authUrlSelectAccount = client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'select_account',
  scope: ['https://www.googleapis.com/auth/drive.appfolder'],
});
const authUrlConsent = client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive.appfolder'],
});

module.exports = {
  authUrlSelectAccount,
  authUrlConsent,
  client,
  createClient,
};
