"use strict";
require("dotenv").config();
const express = require("express");
const myDB = require("./connection");
const passport = require("passport");
const session = require("express-session");
const fccTesting = require("./freeCodeCamp/fcctesting.js");

const routes = require("./routes");
const auth = require("./auth");
const app = express();

const http = require('http').createServer(app);
const io = require('socket.io')(http);

// For socket connection info
const passportSocketIo = require('passport.socketio');
const MongoStore = require('connect-mongo')(session);
const cookieParser = require('cookie-parser');
const store = new MongoStore({ url: process.env.MONGO_URI });

const rootLevelLogger = (req, res, next) => {
  console.log("Logger: " + req.method + " " + req.path + " - " + req.ip);
  next();
};

app.use(rootLevelLogger);

app.set("view engine", "pug");

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
      key: 'express.sid',
      secret: process.env.SESSION_SECRET,
      resave: true,
      saveUninitialized: true,
      store: store,
      cookie: { secure: false },
    })
  );

// Initialize passport
app.use(passport.initialize());
// For persistent login
app.use(passport.session());



myDB(async (client) => {
  const myDataBase = await client.db("database").collection("users");
  auth(app, myDataBase);
  routes(app, myDataBase);
  
  io.use(
    passportSocketIo.authorize({
      cookieParser: cookieParser,
      key: 'express.sid',
      secret: process.env.SESSION_SECRET,
      store: store,
      success: onAuthorizeSuccess,
      fail: onAuthorizeFail
    })
  );
  
  let currentUsers = 0;
  io.on('connection', socket => {
    console.log('User ' + socket.request.user.name + ' connected');
    ++currentUsers;
    let name = socket.request.user.name;
    io.emit('user', {
      name: name,
      currentUsers,
      connected: true
    });
    
    socket.on('chat message', message => {
      console.log('server received message from client')
      // send message to all users in chat
      io.emit('chat message', {
        name: name,
        message: message
      });
    });

    socket.on('disconnect', socket => {
      console.log('socket is', socket);
      --currentUsers;
      io.emit('user', {
        name: name,
        currentUsers,
        connected: false
      });
    });
  });
}).catch((e) => {
  app.route("/").get((req, res) => {
    res.render("pug", {
      title: e,
      message: "Unable to login",
    });
  });
});

function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');
  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  error = 'hi'
  if (error) {
    throw new Error(message);
  }
  console.log('failed connection to socket.io', message);
  accept(null, false);
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});