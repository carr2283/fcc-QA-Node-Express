const passport = require("passport");
const bcrypt = require("bcrypt");

module.exports = function (app, myDataBase) {
  app.route("/").get((req, res) => {
    res.render("pug", {
      title: "Connected to Database",
      message: "Please login",
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true
    });
  });

  app.route("/register").post(
    (req, res, next) => {
      myDataBase.findOne({ username: req.body.username }, (err, user) => {
        if (err) {
          next(err);
        } else if (user) {
          // If user already registered, go home
          console.log("User is already registered.");
          res.redirect("/");
        } else {
          const SALT_ROUNDS = 12;
          const hash = bcrypt.hashSync(req.body.password, SALT_ROUNDS);
          myDataBase.insertOne(
            {
              name: req.body.username,
              username: req.body.username,
              password: hash,
            },
            (err, doc) => {
              if (err) {
                res.redirect("/");
              } else {
                next(null, doc.ops[0]);
              }
            }
          );
        }
      });
    },

    passport.authenticate("local", { failureRedirect: "/" }),
    (req, res, next) => {
      console.log("hello");
      return res.redirect("/profile");
    }
  );

  app.post(
    "/login",
    passport.authenticate("local", {
      failureRedirect: "/",
    }),
    (req, res) => {
      res.redirect("/profile");
    }
  );
  
  app.route('/auth/github').get(passport.authenticate('github'));

  app.route('/auth/github/callback').get(passport.authenticate('github', { failureRedirect: '/'}), (req, res) => {
    req.session.user_id = req.user.id;
    res.redirect('/chat');
  });
  
  app.route("/profile").get(ensureAuthenticated, (req, res) => {
    res.render("pug/profile", { username: req.user.username });
  });

  app.route("/logout").get((req, res) => {
    req.logout();
    res.redirect("/");
  });
  
  app.route('/chat').get(ensureAuthenticated, (req, res) => {
    res.render('pug/chat', { user: req.user })
  })

  app.get("/clear", (req, res, next) => {
    myDataBase.deleteMany({}, (err, data) => {
      if (err) {
        return next(err);
      }
      res.json(data);
    });
  });

  app.use((req, res, next) => {
    res.status(404).type("text").send("Not Found");
  });
};

function ensureAuthenticated(req, res, next) {
  console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
    console.log('Authenticated');
    return next();
  }
  console.log('Not Authenticated');
  res.redirect("/");
}
