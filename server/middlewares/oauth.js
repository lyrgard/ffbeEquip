import OAuth  from "../lib/oauth.js";

export async function OAuthFunction(req, res, next){
  const { tokens } = req.OAuthSession;
  if (!tokens) {
    console.log("No tokens found...")
    return res.status(401).send();
  }

  console.log("Tokens found")
  req.OAuth2Client = OAuth.createClient(tokens);

  return await req.OAuth2Client.getRequestMetadataAsync(null, (error) => {
    req.OAuthSession.tokens = req.OAuth2Client.credentials;
    console.log(req.OAuthSession.tokens)
    next(error);
  });
};

export default { OAuthFunction }
