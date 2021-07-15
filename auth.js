require("dotenv").config();
const bcrypt = require("bcrypt");
const ObjectID = require("mongodb").ObjectID;
const passport = require("passport");
const LocalStrategy = require("passport-local");
var GitHubStrategy = require("passport-github").Strategy;

module.exports = function (app, myDataBase) {
  passport.serializeUser((user, done) => {
    console.log("serializing user " + user.username);
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    console.log("deserializing user ");
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      if (err) {
        return done(err);
      }
      done(null, doc);
    });
  });

  passport.use(
    new LocalStrategy((username, password, done) => {
      myDataBase.findOne({ username: username }, (err, user) => {
        console.log(
          "User " +
            username +
            " and password: " +
            password +
            " attempted to log in."
        );
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false);
        }
        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false);
        }
        console.log("good!");
        console.log("hash is ", user.password);
        return done(null, user);
      });
    })
  );
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL:
          "https://geode-celestial-attention.glitch.me/auth/github/callback",
      },
      (accessToken, refreshToken, profile, cb) => {
        console.log("profile is ", profile);
        myDataBase.findOneAndUpdate(
          // query
          { githubId: profile.id },
          // update
          {
            $setOnInsert: {
              githubId: profile.id,
              name: profile.displayName || "John Doe",
              email: Array.isArray(profile.emails)
                ? profile.emails[0].value
                : "No public email",
              created_on: new Date(),
              provider: profile.provider || "",
            },
            $set: {
              last_login: new Date(),
            },
            $inc: {
              login_count: 1,
            },
          },
          // options
          {
            upsert: true,
            new: true,
          },
          (err, doc) => {
            if (err) return cb(err);
            console.log("doc is ", doc.value);
            return cb(null, doc.value);
          }
        );
      }
    )
  );
};
