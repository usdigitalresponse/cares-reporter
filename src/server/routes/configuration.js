const express = require("express");
const router = express.Router();
const { requireUser } = require("../access-helpers");
const { users, roles, tables, templates } = require("../db");

router.get("/", requireUser, function(req, res) {
  const ps = [users(), roles(), tables(), templates()];
  Promise.all(ps).then(([users, roles, tables, templates]) => {
    res.json({ users, roles, tables, templates });
  });
});

module.exports = router;
