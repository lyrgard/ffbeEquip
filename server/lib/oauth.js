import { google } from 'googleapis'
import ServerConfig from '../../config.js';

const config = ServerConfig.ServerConfig;

const { OAuth2 } = google.auth;

/**
 * @summary Create a Google OAuth2 client
 * @param {Object} tokens - User OAuth tokens
 * @returns {OAuth2}
 */
export const createClient = (tokens) => {
  const OAuth2Client = new OAuth2(
    config.google.oAuthConfiguration.web.client_id,
    config.google.oAuthConfiguration.web.client_secret,
    config.google.oAuthConfiguration.web.redirect_uris[0],
  );

  if (tokens) {
    OAuth2Client.setCredentials(tokens);
  }

  return OAuth2Client;
};

export const client = createClient();
export const authUrlSelectAccount = client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'select_account',
  scope: ['https://www.googleapis.com/auth/drive.appfolder'],
});
export const authUrlConsent = client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive.appfolder'],
});

export default {
  authUrlSelectAccount,
  authUrlConsent,
  client,
  createClient,
};
