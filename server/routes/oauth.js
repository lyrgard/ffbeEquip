const Promise = require('bluebird');
const OAuth = require('../lib/oauth.js');

const OAuth2Client = OAuth.createClient();

const authorize = (req, res) => {
  const url = OAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.appfolder',
    ],
  });
  return res.json({ url });
};

const callback = async (req, res) => {
  const { state, code } = req.query;
  const tokens = await Promise.fromCallback(cb => (
    OAuth2Client.getToken(code, cb)
  ));

  req.OAuthSession.tokens = tokens;
  return res.redirect(state);
};

const logout = (req, res) => {
  req.OAuthSession.reset();
  return res.redirect('back');
};

module.exports = {
  authorize,
  callback,
  logout,
};
