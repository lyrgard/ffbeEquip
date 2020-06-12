var admin = require("firebase-admin");
const config = require('../../config.js');
var serviceAccount = require.main.require(config.firebaseConfFile);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://" + config.firebaseDatabaseId + ".firebaseio.com"
});

var bucket = admin.storage().bucket("gs://" + config.firebaseBucketUri);

module.exports = bucket;
