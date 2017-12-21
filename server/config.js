const fs = require('fs');
const path = require('path');

const conf = {
  port: process.env.PORT || 3000,
  secret: process.env.SECRET || 'This is not secure, change it!',
  googleApiKey: process.env.GOOGLE_API_KEY,
  googleApiKeyFile: process.env.GOOGLE_API_KEY_FILE || path.join(__dirname, '../googleOAuth/googlApiKey.txt'),
  googleOAuthCredential: {},
  googleOAuthCredentialFile: process.env.GOOGLE_OAUTH_FILE || path.join(__dirname, '../googleOAuth/client_secret.json')
};

if (!conf.googleApiKey) {
  // Backward compatibility with txt file
  try {
    const content = fs.readFileSync(conf.googleApiKeyFile);
    conf.googleApiKey = content.toString();
  } catch (err) {
    console.log(`Error loading Google API Key: ${err}`);
  }
}

try {
  const content = fs.readFileSync(conf.googleOAuthCredentialFile);
  conf.googleOAuthCredential = JSON.parse(content.toString());
} catch (err) {
  console.log(`Error loading Google OAuth Credential: ${err}`);
}

module.exports = conf;
