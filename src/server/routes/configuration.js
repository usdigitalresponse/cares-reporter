const express = require("express");
const router = express.Router();
const { requireUser } = require("../access-helpers");
const { user: getUser, users: getUsers, roles: getRoles } = require("../db");
const { getTemplateSheets } = require("../services/get-template");
const { makeConfig, makeTables, makeTemplate } = require("../lib/config");

router.get("/", requireUser, async function(req, res) {
  const user = await getUser(req.signedCookies.userId);
  const users = user.role === "admin" ? await getUsers() : [user];
  const roles = await getRoles();
  const config = makeConfig(getTemplateSheets());
  const tables = makeTables(config);
  const templates = [makeTemplate(config)];
  res.json({ configuration: { users, roles, tables, templates } });
});

module.exports = router;
