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
  res.locals.infos = req.flash("info");
  next();
});

router.get("/", function (req, res) {
  res.render("index");
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
    "Password confirmation does not match password."
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
          membershipStatus: false,
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
    successRedirect: "/",
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
    successRedirect: "/",
    failureRedirect: "/log-in",
    failureFlash: true,
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

router.get("/membership", (req, res) => {
  res.render("membership");
});

router.post(
  "/membership",
  body("passcode", "Passcode is incorrect.").custom(
    (value) => value === "webdev"
  ),
  (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
      res.render("membership", {
        validationErr: validationResult(req).array(),
      });
    }
    //find user id and update membership
    const id = { _id: req.body.id };
    const update = { membershipStatus: true };

    User.findByIdAndUpdate(id, update, function (err, result) {
      if (err) {
        return next(err);
      }
      if (result) {
        req.flash("info", "You have gained membership status.");
        res.redirect("/");
      }
    });
  }
);

module.exports = router;
