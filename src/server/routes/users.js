const express = require("express");
const router = express.Router();
const { requireAdminUser } = require("../access-helpers");
const { agencyById, createUser, user: getUser, updateUser } = require("../db");
const { sendWelcomeEmail } = require("../lib/email");

router.post("/", requireAdminUser, function(req, res, next) {
  console.log("POST /users");
  console.log(req.body);
  const { email, name, role, agency_id } = req.body;
  if (!email) {
    res.status(400).send("User email is required");
    return;
  }
  const user = {
    email: req.body.email.toLowerCase().trim(),
    role,
    name,
    agency_id
  };
  createUser(user)
    .then(result => res.json({ user: result }))
    .then(() => sendWelcomeEmail(user.email, req.headers.origin))
    .catch(e => {
      if (e.message.match(/violates unique constraint/)) {
        res.status(400).send("User with that email already exists");
      } else {
        next(e);
      }
    });
});

router.put("/:id", requireAdminUser, async function(req, res, next) {
  console.log("PUT /users/:id");
  console.log(req.body);
  let user = await getUser(req.params.id);
  if (!user) {
    res.status(400).send("User not found");
    return;
  }
  const { email, name, role, agency_id } = req.body;
  if (!email) {
    res.status(400).send("User email is required");
    return;
  }
  const agency = await agencyById(agency_id);
  if (!agency) {
    res.status(400).send("Invalid agency");
    return;
  }
  user = {
    ...user,
    email: req.body.email.toLowerCase().trim(),
    name,
    role,
    agency_id
  };
  updateUser(user)
    .then(result => res.json({ user: result }))
    .then(() => sendWelcomeEmail(user.email, req.headers.origin))
    .catch(e => {
      if (e.message.match(/violates unique constraint/)) {
        res.status(400).send("User with that email already exists");
      } else {
        next(e);
      }
    });
});

module.exports = router;
