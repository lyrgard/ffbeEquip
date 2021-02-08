const fs = require('fs');
const path = require('path');
const Joi = require('joi');

const CONFIG_FILE = path.join(__dirname, '.config.json');

const oauthSchema = Joi.object({
    web: Joi.object({
        client_id: Joi.string().required(),
        client_secret: Joi.string().required(),
        redirect_uris: Joi.array().min(1).required(),
    }).unknown().required(),
});
const firebaseConfSchema = Joi.object({
    type: Joi.string().required(),
    project_id: Joi.string().required(),
    private_key_id: Joi.string().required(),
    private_key: Joi.string().required(),
    client_email: Joi.string().required(),
    client_id: Joi.string().required(),
    auth_uri: Joi.string().required(),
    token_uri: Joi.string().required(),
    auth_provider_x509_cert_url: Joi.string().required(),
    client_x509_cert_url: Joi.string().required()
});

const configSchema = Joi.object({
    env: Joi.string().required(),
    port: Joi.number().integer().required(),
    secret: Joi.string().required(),
    google: Joi.object({
        enabled: Joi.boolean().required(),
        oAuthConfiguration: oauthSchema,
    }).required(),
    firebase: Joi.object({
        enabled: Joi.boolean().required(),
        bucketUri: Joi.string().required(),
        databaseId: Joi.string().required(),
        configuration: firebaseConfSchema,
    }).required(),
    imgur: Joi.object({
        enabled: Joi.boolean().required(),
        clientId: Joi.string().required(),
    }).required(),
});



/**
 * @summary Read json file
 * @param {String} filePath - path to json
 * @returns {Object}
 */
const readJson = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return {};
  }
};

const config = readJson(CONFIG_FILE);

// ALlow env vars override
config.env = process.env.NODE_ENV || config.env;
config.port = process.env.PORT || config.port;

const validation = configSchema.validate(config);

if (validation.error) {
    console.log('Invalid configuration, run "node config.js"', validation.error);
    process.exit(1);
}

// Env utils
config.isDev = (config.env === 'development');
config.isProd = (config.env === 'production');

module.exports = config;
