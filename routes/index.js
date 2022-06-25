var express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
var router = express.Router();

const User = require("../models/user");

// custom middleware, access to currentUser in all views
router.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index");
});

router.get("/signup", function (req, res, next) {
  res.render("signup");
});

router.post("/signup", function (req, res, next) {
  bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
    if (err) {
      return next(err);
    }
    const user = new User({
      username: req.body.username,
      password: hashedPassword,
    }).save((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });
});

// corresponds w/ index.ejs form action
router.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
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
