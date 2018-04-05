const OAuth = require('../lib/oauth.js');

module.exports = (req, res, next) => {
  const { tokens } = req.OAuthSession;
  if (!tokens) {
      console.log("No token found, send beck 401");
    return res.status(401).send();
  }

  req.OAuth2Client = OAuth.createClient(tokens);

  return req.OAuth2Client.getRequestMetadata(null, (error) => {
      console.log("Error : ");
      console.log(error);
      console.log(req.OAuth2Client.credentials);
    req.OAuthSession.tokens = req.OAuth2Client.credentials;
    next(error);
  });
};
