const Joi = require('joi');
const Boom = require('boom');
const express = require('express');
const validator = require('../middlewares/validator.js');
const drive = require('../lib/drive.js');
const OAuth = require('../lib/oauth.js');

const route = express.Router();

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
    if (tokens.refresh_token) {
        await drive.writeJson(auth, 'refreshToken.json', {"refreshToken": tokens.refresh_token});
        console.log("refresh token writen to drive");
    } else {
        let refreshTokenData = await drive.readJson(auth, 'refreshToken.json', {});
        if (!refreshTokenData.refreshToken) {
            console.log("redirect to consent to get refresh token");
            return res.redirect(OAuth.authUrlConsent + "&state=" + encodeURIComponent(state));
        } else {
            req.OAuthSession.tokens.refresh_token = refreshTokenData.refreshToken;
            console.log("refresh token read from drive");
        }
    }
    console.log(req.OAuthSession.tokens)
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

module.exports = route;
