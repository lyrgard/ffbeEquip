import firebase from 'firebase-admin'
let admin = firebase
import ServerConfig from '../../config.js';

let config = ServerConfig.ServerConfig

admin.initializeApp({
  credential: admin.credential.cert(config.firebase.configuration),
  databaseURL: "https://" + config.firebase.databaseId + ".firebaseio.com"
});

var bucket = admin.storage().bucket("gs://" + config.firebase.bucketUri);

export default { bucket }
