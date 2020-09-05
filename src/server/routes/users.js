const express = require("express");
const router = express.Router();
const { requireAdminUser } = require("../access-helpers");
const { createUser } = require("../db");
const _ = require("lodash");

router.post("/", requireAdminUser, function(req, res, next) {
  console.log("POST /users");
  console.log(req.body);
  const user = _.pick(req.body, ["email", "role", "agency_id"]);
  createUser(user)
    .then(result => res.json({ user: result }))
    .catch(e => {
      if (e.message.match(/violates unique constraint/)) {
        res.status(400).send("User with that email already exists");
      } else {
        next(e);
      }
    });
});

module.exports = router;
