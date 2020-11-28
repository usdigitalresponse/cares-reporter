const express = require("express");
const router = express.Router();
const { requireAdminUser } = require("../access-helpers");
const { agencyById, createUser, user: getUser, updateUser } = require("../db");
const { sendWelcomeEmail } = require("../lib/email");
const _ = require("lodash-checkit");

async function validateUser(req, res, next) {
  const { email, role, agency_id } = req.body;
  if (!email) {
    res.status(400).send("User email is required");
    return;
  }
  if (!_.isEmail(email)) {
    res.status(400).send("Invalid email address");
    return;
  }
  if (!role) {
    res.status(400).send("Role required");
    return;
  }
  if (agency_id) {
    const agency = await agencyById(agency_id);
    if (!agency) {
      res.status(400).send("Invalid agency");
      return;
    }
  } else if (role != "admin") {
    res.status(400).send("Reporter role requires agency");
    return;
  }
  next();
}

router.post("/", requireAdminUser, validateUser, async function(
  req,
  res,
  next
) {
  console.log("POST /users", req.body);
  const { email, name, role, agency_id } = req.body;
  const user = {
    email: email.toLowerCase().trim(),
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

router.put("/:id", requireAdminUser, validateUser, async function(
  req,
  res,
  next
) {
  console.log("PUT /users/:id", req.body);
  let user = await getUser(req.params.id);
  if (!user) {
    res.status(400).send("User not found");
    return;
  }
  const { email, name, role, agency_id } = req.body;
  user = {
    ...user,
    email: email.toLowerCase().trim(),
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
