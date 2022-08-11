import Joi from 'joi'
import Boom from '@hapi/boom'
import express from 'express'
import * as validator from '../middlewares/validator.js';
import * as drive from '../lib/drive.js';
import * as OAuth from '../lib/oauth.js';

export const route = express.Router();

/**
 * "GET /googleOAuthUrl"
 */
route.get('/googleOAuthUrl', (req, res) => {
  return res.json({ url: OAuth.authUrlSelectAccount });
});

/**
 * "GET /googleOAuthSuccess"
 */
const callbackSchema = Joi.object({
  code: Joi.string().required(),
  state: Joi.string().uri().required(),
  scope: Joi.string(),
});

route.get('/googleOAuthSuccess', validator.query(callbackSchema), (req, res, next) => {
  const { state, code } = req.query;

  OAuth.client.getToken(code, async (err, tokens) => {
    if (err) {
      return next(Boom.boomify(err, {
        statusCode: err.code,
      }));
    }
    req.OAuthSession.tokens = tokens;
    const auth = OAuth.createClient(tokens);
    console.log(tokens)
    if (tokens.refresh_token) {
        await drive.writeJson(auth, 'refreshToken.json', {"refreshToken": tokens.refresh_token});
    } else {
        let refreshTokenData = await drive.readJson(auth, 'refreshToken.json', {});
        console.log(refreshTokenData)
        if (!refreshTokenData.refreshToken) {
            return res.redirect(OAuth.authUrlConsent + "&state=" + encodeURIComponent(state));
        } else {
            req.OAuthSession.tokens.refresh_token = refreshTokenData.refreshToken;
        }
    }
    console.log(req.OAuthSession.tokens.refreshToken)
    return res.redirect(state);
  });
});

/**
 * "GET /googleOAuthLogout"
 */
route.get('/googleOAuthLogout', (req, res) => {
  req.OAuthSession.reset();
  return res.redirect('back');
});

export default route