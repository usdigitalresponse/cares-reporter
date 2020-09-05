const express = require("express");
const router = express.Router();
const { requireUser } = require("../access-helpers");
const {
  user: getUser,
  users: getUsers,
  roles,
  tables,
  templates
} = require("../db");

router.get("/", requireUser, async function(req, res) {
  const user = await getUser(req.signedCookies.userId);
  const users = user.role === "admin" ? await getUsers() : [user];
  const ps = [roles(), tables(), templates()];
  Promise.all(ps).then(([roles, tables, templates]) => {
    res.json({ configuration: { users, roles, tables, templates } });
  });
});

module.exports = router;
