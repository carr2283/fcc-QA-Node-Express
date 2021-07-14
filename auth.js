const bcrypt = require('bcrypt');
const ObjectID = require('mongodb').ObjectID;
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local');


module.exports = function (app, myDataBase) {
  
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  }))
  
  // Initialize passport
  app.use(passport.initialize());
  // For persistent login
  app.use(passport.session());
  
  
  passport.serializeUser((user, done) => {
  console.log('serializing user' + user.username);
  done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    console.log('deserializing user ');
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) =>
                   done(null, doc)
                 );
  });
  
  
  passport.use(new LocalStrategy(
    (username, password, done) => {
      myDataBase.findOne({username: username}, (err, user) => {
        console.log('User ' + username + ' and password: ' + password + ' attempted to log in.')
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false); 
        }
        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false);
        }
        console.log('good!')
        console.log('hash is ', user.password);
        return done(null, user);
      });
    }
  ));
}