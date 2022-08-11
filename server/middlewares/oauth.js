import OAuth  from "../lib/oauth.js";

export function OAuthFunction(req, res, next){
  const { tokens } = req.OAuthSession;
  if (!tokens) {
    console.log("No tokens found...")
    return res.status(401).send();
  }

  console.log("Tokens found")
  req.OAuth2Client = OAuth.createClient(tokens);

  return req.OAuth2Client.getRequestMetadataAsync(null);
};

export default { OAuthFunction }
