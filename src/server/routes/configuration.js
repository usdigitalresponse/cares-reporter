const express = require("express");
const router = express.Router();
const { requireUser } = require("../access-helpers");
const { user: getUser, users: getUsers, roles: getRoles } = require("../db");
const { getTemplate } = require("../services/get-template");
const _ = require("lodash");

function makeConfig(allSheets) {
  const ignoreSheets = ["Cover", "Dropdowns", "Summary", "Projects"];
  const sheets = _.omit(allSheets, ignoreSheets);
  return {
    name: "Agency template",
    settings: _.map(sheets, (value, key) => {
      return {
        sheetName: key,
        tableName: key,
        columns: value[0]
      };
    })
  };
}

function makeTemplate(content) {
  return {
    name: "Agency Template",
    type: "templates",
    sort_order: 0,
    content
  };
}

function makeTables(config) {
  return config.settings.map((sheet, n) => {
    const name = sheet.sheetName;
    return {
      name,
      type: "tables",
      sort_order: n,
      content: {
        name,
        columns: _.map(sheet.columns, name => {
          return {
            name: name
          };
        }),
        relations: []
      }
    };
  });
}

router.get("/", requireUser, async function(req, res) {
  const user = await getUser(req.signedCookies.userId);
  const users = user.role === "admin" ? await getUsers() : [user];
  const roles = await getRoles();
  const config = makeConfig(getTemplate());
  const tables = makeTables(config);
  const templates = [makeTemplate(config)];
  res.json({ configuration: { users, roles, tables, templates } });
});

module.exports = router;
