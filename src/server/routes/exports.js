const express = require("express");
const router = express.Router();
const { requireUser } = require("../access-helpers");
const { documents: getDocuments } = require("../db");
const { getTemplate } = require("../services/get-template");
const { makeConfig, makeTemplate } = require("../lib/config");
const { makeSpreadsheet } = require("../lib/spreadsheet");
const _ = require("lodash");

router.get("/", requireUser, function(req, res) {
  const template = makeTemplate(makeConfig(getTemplate()));
  if (!template) {
    res.sendStatus(404);
    res.end();
  } else {
    getDocuments().then(documents => {
      console.log(`Found ${documents.length} documents`);
      const groups = _.groupBy(documents, "type");
      console.log(`Found ${_.keys(groups).length} groups`);
      const attachmentData = makeSpreadsheet(template.content, groups);
      const filename = `${template.name}.xlsx`;
      res.header("Content-Disposition", `attachment; filename="${filename}"`);
      res.header("Content-Type", "application/octet-stream");
      res.end(Buffer.from(attachmentData, "binary"));
    });
  }
});

module.exports = router;
