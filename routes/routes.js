var express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
var router = express.Router();
const { body, validationResult } = require("express-validator");
const { DateTime } = require("luxon");

const User = require("../models/user");
const Message = require("../models/message");

// custom middleware with usefull variables
router.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.errors = req.flash("error");
  res.locals.validationErr = validationResult(req).array();
  res.locals.infos = req.flash("info");
  next();
});

router.get("/", function (req, res, next) {
  Message.find()
    .sort({ createdAt: "descending" })
    .exec(function (err, msg) {
      if (err) {
        return next(err);
      }
      res.render("index", { msg: msg });
    });
});

router.post("/", (req, res, next) => {
  Message.findByIdAndDelete(req.body.msg_id, (err) => {
    if (err) {
      return next(err);
    }
    req.flash("info", "Message deleted.");
    return res.redirect("/");
  });
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
      return res.render("signup", {
        validationErr: validationResult(req).array(),
      });
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
        new User({
          username: req.body.username,
          password: hashedPassword,
          membershipStatus: false,
          admin: false,
        }).save((err) => {
          if (err) {
            return next(err);
          }
          return next();
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

router.get("/log-out", (req, res, next) => {
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
      return res.render("membership", {
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
        return res.redirect("/");
      }
    });
  }
);

router.get("/message-form", (req, res) => {
  res.render("message-form");
});

router.post(
  "/message-form",
  body("title")
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage("Title must be specified."),
  body("message")
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage("Message must be specified."),
  (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
      return res.render("message-form", {
        validationErr: validationResult(req).array(),
      });
    }
    new Message({
      title: req.body.title,
      text: req.body.message,
      createdAt: DateTime.now().toLocaleString(
        DateTime.DATETIME_MED_WITH_SECONDS
      ),
      author: req.body.author,
    }).save((err) => {
      if (err) {
        return next(err);
      }
      req.flash("info", "Message created");
      return res.redirect("/");
    });
  }
);

router.get("/admin", (req, res) => {
  res.render("admin");
});

router.post(
  "/admin",
  body("admin", "Passcode is incorrect.").custom(
    (value) => value === "webdevadmin"
  ),
  (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
      return res.render("admin", {
        validationErr: validationResult(req).array(),
      });
    }
    //find user id and update membership
    const id = { _id: req.body.id };
    const update = { admin: true };

    User.findByIdAndUpdate(id, update, function (err, result) {
      if (err) {
        return next(err);
      }
      if (result) {
        req.flash("info", "You have become an admin.");
        return res.redirect("/");
      }
    });
  }
);

module.exports = router;
