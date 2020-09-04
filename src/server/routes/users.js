const express = require("express");
const router = express.Router();
const { requireAdminUser } = require("../access-helpers");
const { createUser } = require("../db");

router.post("/", requireAdminUser, function(req, res) {
  console.log("POST /users");
  console.log(req.body);
  const { email, role, agency_id } = req.body;
  const user = {
    email,
    role,
    agency_id
  };
  createUser(user).then(result => res.json({ user: result }));
});

module.exports = router;
