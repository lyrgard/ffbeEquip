import fs from 'fs';
import path from 'path';
import Joi from 'Joi'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
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

export let ServerConfig = readJson(CONFIG_FILE);

/**
 * @summary Write json file
 * @param {String} filePath - path to json
 * @param {any} data
 */
const writeJson = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, '  '));
};

// ALlow env vars override
ServerConfig.env = process.env.NODE_ENV || ServerConfig.env;
ServerConfig.port = process.env.PORT || ServerConfig.port;

const validation = configSchema.validate(ServerConfig);

if (validation.error) {
    const oldFileFormatValidation = old_configSchema.validate(ServerConfig);
    if (oldFileFormatValidation.error) {
        console.log('Invalid configuration. See README"', validation.error);
        process.exit(1);
    } else {
        console.log('Found old config format. Will attempt to convert to new format');
        // Dynamically load OAuth credentials
        ServerConfig.googleOAuthCredential = readJson(ServerConfig.googleOAuthFile);
        ServerConfig.firebaseConf = readJson(ServerConfig.firebaseConfFile);

        const newConfig = {
            "env": ServerConfig.env,
            "port": ServerConfig.port,
            "secret": ServerConfig.secret,
            "google": {
                "enabled": true,
                "oAuthConfiguration": {
                    "web":{
                        "client_id": ServerConfig.googleOAuthCredential.web.client_id,
                        "project_id": ServerConfig.googleOAuthCredential.web.project_id,
                        "auth_uri": ServerConfig.googleOAuthCredential.web.auth_uri,
                        "token_uri": ServerConfig.googleOAuthCredential.web.token_uri,
                        "auth_provider_x509_cert_url": ServerConfig.googleOAuthCredential.web.auth_provider_x509_cert_url,
                        "client_secret": ServerConfig.googleOAuthCredential.web.client_secret,
                        "redirect_uris": ServerConfig.googleOAuthCredential.web.redirect_uris
                    }
                }
            },
            "firebase": {
                "enabled": true,
                "bucketUri": ServerConfig.firebaseBucketUri,
                "databaseId": ServerConfig.firebaseDatabaseId,
                "configuration": {
                    "type": ServerConfig.firebaseConf.type,
                    "project_id": ServerConfig.firebaseConf.project_id,
                    "private_key_id": ServerConfig.firebaseConf.private_key_id,
                    "private_key": ServerConfig.firebaseConf.private_key,
                    "client_email": ServerConfig.firebaseConf.client_email,
                    "client_id": ServerConfig.firebaseConf.client_id,
                    "auth_uri": ServerConfig.firebaseConf.auth_uri,
                    "token_uri": ServerConfig.firebaseConf.token_uri,
                    "auth_provider_x509_cert_url": ServerConfig.firebaseConf.auth_provider_x509_cert_url,
                    "client_x509_cert_url": ServerConfig.firebaseConf.client_x509_cert_url
                }
            },
            "imgur": {
                "enabled": true,
                "clientId": ServerConfig.imgurClientId
            }
        };
        writeJson(OLD_CONFIG_FILE_BACKUP, ServerConfig);
        writeJson(CONFIG_FILE, newConfig);

        ServerConfig = newConfig;
    }
}

// Env utils
ServerConfig.isDev = (ServerConfig.env === 'development');
ServerConfig.isProd = (ServerConfig.env === 'production');

export default { ServerConfig }