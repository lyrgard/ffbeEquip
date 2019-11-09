![](https://cdn.discordapp.com/icons/389844892853075969/69657d37c167df648dd93205435ca2e7.png?size=128) 

# Final Fantasy Brave Exvius Equipment Tool 
![GitHub repo size](https://img.shields.io/github/repo-size/lyrgard/ffbeEquip)
![GitHub contributors](https://img.shields.io/github/contributors/lyrgard/ffbeEquip)
![GitHub](https://img.shields.io/github/license/lyrgard/ffbeEquip)

Welcome to FFBE Equip, an online tool for [Final Fantasy Brave Exvius](http://www.finalfantasyexvius.com/). Features include building units/parties, searching units/gear, and saving user inventory/units/espers.

Check it out here: https://ffbeequip.com/

# How to run locally

## Get the code
Either clone/fork the repo, or download the code as an archive. Your Git root (referenced below) will be where you place the repository.

## Obtain OAuth client credentials from the Google API Console
OAuth is used to authenticate users, while Google Drive is used to store the user data such as item inventory, unit collection, espers, etc...
  1) Go to the [Google API Console](https://console.developers.google.com/apis/credentials)
  2) Click Create Credentials -> OAuth client ID -> Web Application
  3) Choose a Name: (e.g. ffbeEquip OAuth Client ID)
  4) Under Authorized JavaScript origins: http://localhost:3000
  5) Under Authorized Redirect URIs: http://localhost:3000/googleOAuthSuccess
  6) Click Create - A modal will appear with your client ID and secret, but exit the modal and click on the download icon to the right of the client ID to download as JSON.
  7) Create a folder called googleOAuth in your Git root and place the downloaded JSON file there (`/googleOAuth/client_secret.json`)
  8) Go to Dashboard -> Enable APIs. Search for Google Drive and enable it
   
## Obtain and set up a Firebase account
Firebase is used to share information between users such as builder links to unit/party builds.
  1) Go to the [Firebase Console](https://console.firebase.google.com)
  2) Create a project
  3) Choose a Project Name (e.g. ffbeEquip Dev)
  4) Disable Google Analytics and click Create Project
  5) Set up storage for that project 
      1) Click Storage in the side menu -> get started
      2) Secure Rules -> next
      3) Choose nearest Cloud Storage location -> done
      4) Under Storage -> Rules -> Edit rules - replace with the following:
          ```
          service firebase.storage {
            match /b/{bucket}/o {
              match /{allPaths=**} {
                allow write: if request.auth != null;
                allow read;
              }
            }
          }
          ```
  6) Add a Web App to your project
      1) Click Project Overview in the side menu
      2) Under "Get started by adding Firebase to your app", click the Web icon (</>)
      3) Under Register app, choose an app nickname (e.g. ffbeEquip Dev) - no need to set up hosting
      4) Under Add Firebase SDK ignore the code and click Continue to Console
  7) Generate a private key
      1) In Project Overview in the side menu, click the gear icon -> project settings
      2) Under Service accounts -> Generate new private key -> Generate Key
      3) Rename the JSON file to `firebase_config.json` and move it into the googleOAuth folder
   
## Enable CORS (Cross Origin Resource Sharing)
CORS needs to be enabled so that anyone may read the Firebase files when given a builder link.
  1)  Go to https://console.cloud.google.com/home
  2)  Click "Activate Google Cloud Shell" in the top right, this will open a terminal shell
  3)  Create a file called `cors.json` and open it with an editor (e.g. vim, nano, etc...)
        ```bash
        touch cors.json
        nano cors.json
        ``` 
  4)  Add the following code and save the file:
        ```json
        [
          {
            "origin": ["http://localhost:3000"],
            "method": ["GET"],
            "maxAgeSeconds": 3600
          }
        ]
        ```
  5) Run the following but replace [myproject] with the storage bucket URI (you can copy from the Firebase Storage page)
        ```bash
        gsutil cors set cors.json gs://[myproject].appspot.com
        ``` 

## Run the application
1) Have your Firebase config info handy
   1) Open the Firebase Console -> Project Overview -> Settings -> General
   2) Under the "Your apps" section, you'll see a Firebase SDK Snippet code containing a firebaseConfig object, which we'll use below
2) Set up your node environment.
   1) Open a terminal window and navigate to your Git root
   2) Run `npm install` (there may be a lot of warnings/errors, but the node_modules folder should still be installed)
   3) Run `npm start`
   4) Enter your details from the previous section into the prompted configuration
      1) Server environment: development
      2) Server listen port: 3000
      3) Server encryption secret: client_secret (from client_secret.json)
      4) Google API key: firebaseConfig -> apiKey
      5) Google OAuth file path: googleOAuth/client_secret.json
      6) Firebase conf path: googleOAuth/firebase_config.json
      7) Firebase bucket URI: firebaseConfig => storageBucket
3) You did it! The app should be running at http://localhost:3000

# Connect
Need help or have questions?
- Reach out on [Discord](https://discord.gg/rgXnjhP)
- Message me on [Reddit](https://www.reddit.com/message/compose/?to=lyrgard)

# Support FFBE Equip
Looking for other ways to support FFBE Equip?
- Buy me a [coffee](https://ko-fi.com/Lyrgard)
- Become a patron on [Patreon](https://www.patreon.com/Lyrgard)

# License
FFBE Equip is released under the [ISC License](https://opensource.org/licenses/ISC).
