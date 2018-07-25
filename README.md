# Final Fantasy Brave Exvius Equipment Tool
Online tool to filter through [Final Fantasy Brave Exvius](http://www.finalfantasyexvius.com/) Equipment

You can use the tool by visiting: http://lyrgard.fr/lyr/ffbeEquip/


# How to run locally

## Get the code
Either clone/fork the repo, or download the code as an archive. Your Git root (referenced below) will be where you place the repository.

## Set up API authorization and Firebase
You will need to set up google api credentials for saving state.

1) Go to https://console.developers.google.com/apis/credentials
2) Create Credentials
3) OAuth client ID
4) Web Application
5) Under Authorized Javascript origins: http://127.0.0.1:3000
6) Under Authorised redirect URIs: http://127.0.0.1:3000/googleOAuthSuccess
7) Download the OAuth 2.0 client IDs (as JSON)
8) Move saved file to <GitRoot>/googleOAuth/client_secret.json
9) Go to Dashboard -> Enable APIs -> search for Google Drive -> Make sure it is enabled
10) Obtain a Firebase account
11) Create a project for your ffbeEquip development
12) Set up storage for that project (click storage in the side menu -> enable it)
13) Read https://firebase.google.com/docs/admin/setup?authuser=0 under the section "Add Firebase to your app"
14) Open the downloaded .json from the previous step and put it somewhere in your Git root
15) Make sure to write down your Firebase storage bucket URI (you can see it in Firebase -> Your project -> Storage)
16) Make sure to write down your Firebase database ID (you can see it in Firebase -> Your project -> Database)
17) Follow this guide to enable CORS for http://localhost:3000 on your bucket: https://groups.google.com/forum/#!msg/firebase-talk/oSPWMS7MSNA/RnvU6aqtFwAJ

## Run the application
Set up your node environment

1) Run 'npm install'
2) Run 'npm start'
3) Enter your details from the previous section into the prompted configuration
