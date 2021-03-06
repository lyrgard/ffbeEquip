var admin = require("firebase-admin");
const config = require('../../config.js');

admin.initializeApp({
  credential: admin.credential.cert(config.firebase.configuration),
  databaseURL: "https://" + config.firebase.databaseId + ".firebaseio.com"
});

var bucket = admin.storage().bucket("gs://" + config.firebase.bucketUri);

module.exports = bucket;
