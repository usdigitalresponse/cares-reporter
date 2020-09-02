const express = require("express");
const _ = require("lodash-checkit");
const router = express.Router();
const {
  userAndRole,
  accessToken,
  createAccessToken,
  markAccessTokenUsed
} = require("../db");
const { sendPasscode } = require("../lib/email");

router.get("/", function(req, res) {
  const { passcode } = req.query;
  if (passcode) {
    accessToken(passcode).then(token => {
      if (!token) {
        console.log("invalid passcode");
        res.redirect("/login");
      } else {
        markAccessTokenUsed(passcode).then(() => {
          res.cookie("userId", token.user_id, { signed: true });
          res.redirect("/");
        });
      }
    });
  } else if (req.signedCookies.userId) {
    userAndRole(req.signedCookies.userId).then(user => res.json({ user }));
  } else {
    res.json({ message: "No session" });
  }
});

router.get("/logout", function(req, res) {
  res.clearCookie("userId");
  res.redirect("/login");
});

router.post("/", async function(req, res, next) {
  const { email } = req.body;
  if (!_.isEmail(email)) {
    res.statusMessage = "Invalid Email Address";
    return res.sendStatus(400);
  }
  try {
    const passcode = await createAccessToken(email);
    await sendPasscode(email, passcode, req.headers.origin);
    res.json({
      success: true,
      message: `Email sent to ${email}. Check your inbox`
    });
  } catch (e) {
    if (e.message.match(/User .* not found/)) {
      res.json({
        success: false,
        message: e.message
      });
    } else {
      next();
    }
  }
});

module.exports = router;
