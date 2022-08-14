import OAuth  from "../lib/oauth.js";

export function OAuthFunction(req, res, next){
  const { tokens } = req.OAuthSession;
  if (!tokens) {
    return res.status(401).send();
  }

  req.OAuth2Client = OAuth.createClient(tokens);

  let output = req.OAuth2Client.getRequestHeaders(null, (error) => {
    req.OAuthSession.tokens = req.OAuth2Client.credentials;
    next(error);
  });

  if (output) {
    res.headers = output;
  }
  next()
};

export default { OAuthFunction }
