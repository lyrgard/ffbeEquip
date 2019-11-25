const fs = require('fs');
const path = require('path');
const Joi = require('joi');
const inquirer = require('inquirer');
const random = require('crypto-random-string');

const CONFIG_FILE = path.join(__dirname, '.config.json');

const configSchema = Joi.object({
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

/**
 * @summary Write json file
 * @param {String} filePath - path to json
 * @param {any} data
 */
const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, '  '));
};

/**
 * @summary Prompt user for configuration values
 * @param {Object} currentConfig
 * @returns {Promise<Object>}
 */
const setupConfig = (currentConfig) => {
  console.log('FFBE Equip server configuration setup:');
  const questions = [
    {
      type: 'list',
      name: 'env',
      message: 'Server environment',
      choices: ['development', 'production', 'test'],
      default: 'development',
    },
    {
      type: 'input',
      name: 'port',
      message: 'Server listen port',
      default: 3000,
    },
    {
      type: 'input',
      name: 'secret',
      message: 'Server encryption secret',
      default: random(30),
    },
    {
      type: 'input',
      name: 'googleApiKey',
      message: 'Google API Key',
      validate: (value) => {
        return !!value || `"${value}" is not valid`;
      },
    },
    {
      type: 'input',
      name: 'googleOAuthFile',
      message: 'Google OAuth file path',
      filter: (value) => {
        return path.resolve(__dirname, value);
      },
      validate: (value) => {
        try {
          const oauth = readJson(value);
          Joi.assert(oauth, oauthSchema);
          return true;
        } catch (error) {
          return `"${value}" is not valid`;
        }
      },
    },
    {
      type: 'input',
      name: 'firebaseConfFile',
      message: 'Firebase conf file path',
      filter: (value) => {
        return path.resolve(__dirname, value);
      },
      validate: (value) => {
        try {
          const firebaseConf = readJson(value);
          Joi.assert(firebaseConf, firebaseConfSchema);
          return true;
        } catch (error) {
          return `"${value}" is not valid`;
        }
      },
    },
    {
      type: 'input',
      name: 'firebaseBucketUri',
      message: 'Firebase bucket URI',
      validate: (value) => {
        return !!value || `"${value}" is not valid`;
      },
    },
    {
      type: 'input',
      name: 'firebaseDatabaseId',
      message: 'Firebase database Id',
      validate: (value) => {
        return !!value || `"${value}" is not valid`;
      },
    },
    {
      type: 'input',
      name: 'imgurClientId',
      message: 'Imgur Client Id',
      validate: (value) => {
        return !!value || `"${value}" is not valid`;
      },
    },
  ];

  return inquirer
    .prompt(questions.filter(q => !currentConfig[q.name]))
    .then(answers => Object.assign({}, currentConfig, answers));
};

const config = readJson(CONFIG_FILE);

// ALlow env vars override
config.env = process.env.NODE_ENV || config.env;
config.port = process.env.PORT || config.port;

const validation = Joi.validate(config, configSchema);

if (require.main === module && validation.error) {
  setupConfig(config).then((newConfig) => {
    writeJson(CONFIG_FILE, newConfig);
  });
}

if (require.main !== module) {
  if (validation.error) {
    console.log('Invalid configuration, run "node config.js"');
    process.exit(1);
  }

  // Dynamically load OAuth credentials
  config.googleOAuthCredential = readJson(config.googleOAuthFile);
  config.firebaseConf = readJson(config.firebaseConfFile);

  // Env utils
  config.isDev = (config.env === 'development');
  config.isProd = (config.env === 'production');
}

module.exports = config;
