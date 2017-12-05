# Final Fantasy Brave Exvius Equipment Tool
Online tool to filter through [Final Fantasy Brave Exvius](http://www.finalfantasyexvius.com/) Equipment

You can use the tool by visiting: http://lyrgard.fr/lyr/ffbeEquip/


# How to run locally

You will need to set up google api credentials for saving state.

1) Go to https://console.developers.google.com/apis/credentials
2) Create Credentials
3) OAuth client ID
4) Web Application
5) Under Authorized Javascript origins: http://127.0.0.1:3000
6) Under Authorised redirect URIs: http://127.0.0.1:3000/googleOAuthSuccess
7) Download the OAuth 2.0 client IDs (as JSON)
8) Move saved file to ./googleOAuth/client_secret.json

Make sure you have enabled Google Driver API for the project (Should be under Dashboard).
