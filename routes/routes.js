var express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
var router = express.Router();
const { body, validationResult } = require("express-validator");

const User = require("../models/user");

// custom middleware with usefull variables
router.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.errors = req.flash("error");
  res.locals.validationErr = validationResult(req).array();
  next();
});

/* messages before login */
router.get("/", function (req, res) {
  res.render("index");
});

/* messages after login */
router.get("/members", function (req, res) {
  res.render("members");
});

router.get("/sign-up", function (req, res) {
  res.render("signup");
});

router.post(
  "/sign-up",
  // sanitization and validation
  body("username")
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage("Username must be specified."),
  body("password")
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage("Password must be specified."),
  body(
    "confirmPassword",
    "Confirm password field must have the same value as the password field."
  ).custom((value, { req }) => value === req.body.password),

  (req, res, next) => {
    // if errors from above
    if (!validationResult(req).isEmpty()) {
      res.render("signup", { validationErr: validationResult(req).array() });
    }

    // check if the same username exist
    User.findOne({ username: req.body.username }, function (err, user) {
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
          username: req.body.username,
          password: hashedPassword,
        }).save((err) => {
          if (err) {
            return next(err);
          }
          next();
        });
      });
    });
  }
);

router.post(
  "/sign-up",
  passport.authenticate("local", {
    successRedirect: "/members",
    failureRedirect: "/sign-up",
    failureFlash: true,
  })
);

router.get("/log-in", function (req, res) {
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
