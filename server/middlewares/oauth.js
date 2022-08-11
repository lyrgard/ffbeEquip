import OAuth  from "../lib/oauth.js";

export function OAuthFunction(req, res, next){
  const { tokens } = req.OAuthSession;
  if (!tokens) {
    console.log("No tokens found...")
    return res.status(401).send();
  }

  req.OAuth2Client = OAuth.createClient(tokens);

  return req.OAuth2Client.getRequestMetadataAsync(null, (error) => {
    req.OAuthSession.tokens = req.OAuth2Client.credentials;
    console.log(req.OAuthSession.tokens)
    next(error);
  });
};

export default { OAuthFunction }
