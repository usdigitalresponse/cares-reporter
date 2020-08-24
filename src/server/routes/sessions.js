const express = require("express");
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

router.post("/", function(req, res) {
  console.log(req.body);
  const { email } = req.body;
  if (!email) {
    res.sendStatus(400);
    res.end();
  } else {
    createAccessToken(email)
      .then(passcode => sendPasscode(email, passcode))
      .then(() => {
        res.json({
          success: true,
          message: `Email sent to ${email}. Check your inbox`
        });
        res.end();
      })
      .catch(e => {
        res.json({ success: false, message: e.message });
        res.end();
      });
  }
});

module.exports = router;
