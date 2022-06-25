var express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
var router = express.Router();

const User = require("../models/user");

// custom middleware with usefull variables
router.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.errors = req.flash("error");
  //res.locals.infos = req.flash("info");
  next();
});

/* messages before login */
router.get("/", function (req, res, next) {
  res.render("index");
});

/* messages after login */
router.get("/members", function (req, res, next) {
  res.render("members");
});

router.get("/sign-up", function (req, res, next) {
  res.render("signup");
});

router.post("/sign-up", function (req, res, next) {
  var username = req.body.username;

  // check if the same username exist
  User.findOne({ username: username }, function (err, user) {
    if (err) {
      return next(err);
    }
    if (user) {
      req.flash("error", "Username alreay exists.");
      return res.redirect("/sign-up");
    }
    // hash password
    bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
      if (err) {
        return next(err);
      }
      const user = new User({
        username: username,
        password: hashedPassword,
      }).save((err) => {
        if (err) {
          return next(err);
        }
        next();
      });
    });
  });
});

router.post(
  "/sign-up",
  passport.authenticate("local", {
    successRedirect: "/members",
    failureRedirect: "/sign-up",
    failureFlash: true,
  })
);

router.get("/log-in", function (req, res, next) {
  res.render("login");
});

router.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/members",
    failureRedirect: "/log-in",
  })
);

router.get("/log-out", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

module.exports = router;
