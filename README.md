# node-react-mongo-apps
This repository holds code for sample applications developed Node.js and React.

## Diary-Node-Express-app

This application s called **Secret Garden - your personal diary** and uses Express - Node.js web application framework.

It is a simple diary application, where users can register/login by email and password or by Oauth2 with their Google account
and write a diary.

Authentication/security is done by Passport.js

Users and dairy entries are stored in NoSQL database MongoDB and the connection with database is provided by Mongoose.

The application is deployed and hosted on https://secret-garden-18112.herokuapp.com/ and its database is located on AWS cloud - MongoDB Atlas.

## Notes-React-app

This app is for writing/removing sticky notes on the wall.

It is basically just a front-end coded in React.

Run `npm install` and `npm start` from its root folder and a browser window with the app will be opened.
