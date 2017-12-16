const fs = require('fs');
const path = require('path');

const conf = {
  googleApiKey: process.env.GOOGLE_API_KEY,
  googleApiKeyFile: process.env.GOOGLE_API_KEY_FILE || path.join(__dirname, '../googleOAuth/googlApiKey.txt'),
};

if (!conf.googleApiKey) {
  // Backward compatibility with txt file
  try {
    const content = fs.readFileSync(conf.googleApiKeyFile);
    conf.googleApiKey = content.toString();
  } catch (err) {
    console.log('Error loading Google API Key: ' + err);
  }
}

module.exports = conf;
