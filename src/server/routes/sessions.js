const express = require("express");
const router = express.Router();
const { user, userAndRole, accessToken, createAccessToken } = require("../db");

router.get("/", function(req, res) {
  const { passcode } = req.query;
  if (passcode) {
    accessToken(passcode).then(token => {
      if (!token) {
        console.log("invalid passcode");
        res.redirect("/login");
      } else {
        // mark token as used, or just delete it
        user(token.user_id).then(u => {
          console.log("login successful", u);
          res.cookie("userId", u.id, { signed: true });
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
      .then(passcode => {
        console.log(
          `${process.env.SITE_URL}/api/sessions?passcode=${passcode}`
        );
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
