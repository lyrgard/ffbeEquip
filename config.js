const fs = require('fs');
const path = require('path');
const Joi = require('joi');

const CONFIG_FILE = path.join(__dirname, '.config.json');
const OLD_CONFIG_FILE_BACKUP = path.join(__dirname, '.config.json.old');

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

const old_configSchema = Joi.object({
    env: Joi.string().required(),
    port: Joi.number().integer().required(),
    secret: Joi.string().required(),
    googleApiKey: Joi.string().required(),
    googleOAuthFile: Joi.string().required(),
    firebaseConfFile: Joi.string().required(),
    firebaseBucketUri: Joi.string().required(),
    firebaseDatabaseId: Joi.string().required(),
    imgurClientId: Joi.string().required(),
});

const old_oauthSchema = Joi.object({
    web: Joi.object({
        client_id: Joi.string().required(),
        client_secret: Joi.string().required(),
        redirect_uris: Joi.array().min(1).required(),
    }).unknown().required(),
});
const old_firebaseConfSchema = Joi.object({
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

let config = readJson(CONFIG_FILE);

/**
 * @summary Write json file
 * @param {String} filePath - path to json
 * @param {any} data
 */
const writeJson = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, '  '));
};

// ALlow env vars override
config.env = process.env.NODE_ENV || config.env;
config.port = process.env.PORT || config.port;

const validation = configSchema.validate(config);

if (validation.error) {
    const oldFileFormatValidation = old_configSchema.validate(config);
    if (oldFileFormatValidation.error) {
        console.log('Invalid configuration. See README"', validation.error);
        process.exit(1);
    } else {
        console.log('Found old config format. Will attempt to convert to new format');
        // Dynamically load OAuth credentials
        config.googleOAuthCredential = readJson(config.googleOAuthFile);
        config.firebaseConf = readJson(config.firebaseConfFile);

        const newConfig = {
            "env": config.env,
            "port": config.port,
            "secret": config.secret,
            "google": {
                "enabled": true,
                "oAuthConfiguration": {
                    "web":{
                        "client_id": config.googleOAuthCredential.web.client_id,
                        "project_id": config.googleOAuthCredential.web.project_id,
                        "auth_uri": config.googleOAuthCredential.web.auth_uri,
                        "token_uri": config.googleOAuthCredential.web.token_uri,
                        "auth_provider_x509_cert_url": config.googleOAuthCredential.web.auth_provider_x509_cert_url,
                        "client_secret": config.googleOAuthCredential.web.client_secret,
                        "redirect_uris": config.googleOAuthCredential.web.redirect_uris
                    }
                }
            },
            "firebase": {
                "enabled": true,
                "bucketUri": config.firebaseBucketUri,
                "databaseId": config.firebaseDatabaseId,
                "configuration": {
                    "type": config.firebaseConf.type,
                    "project_id": config.firebaseConf.project_id,
                    "private_key_id": config.firebaseConf.private_key_id,
                    "private_key": config.firebaseConf.private_key,
                    "client_email": config.firebaseConf.client_email,
                    "client_id": config.firebaseConf.client_id,
                    "auth_uri": config.firebaseConf.auth_uri,
                    "token_uri": config.firebaseConf.token_uri,
                    "auth_provider_x509_cert_url": config.firebaseConf.auth_provider_x509_cert_url,
                    "client_x509_cert_url": config.firebaseConf.client_x509_cert_url
                }
            },
            "imgur": {
                "enabled": true,
                "clientId": config.imgurClientId;
            }
        };
        writeJson(OLD_CONFIG_FILE_BACKUP, config);
        writeJson(CONFIG_FILE, newConfig);

        config = newConfig;
    }
}

// Env utils
config.isDev = (config.env === 'development');
config.isProd = (config.env === 'production');

module.exports = config;
