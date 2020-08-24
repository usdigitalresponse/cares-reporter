const express = require("express");
const router = express.Router();
const { requireUser } = require("../access-helpers");
const { template: getTemplate, documents: getDocuments } = require("../db");
const { makeSpreadsheet } = require("../lib/spreadsheet");
const _ = require("lodash");

router.get("/:id", requireUser, function(req, res) {
  // TODO should this be requireAdminUser?
  console.log("GET /exports/:id", req.params);
  const { id } = req.params;
  getTemplate(id).then(template => {
    if (!template) {
      res.sendStatus(404);
      res.end();
    } else {
      getDocuments().then(documents => {
        console.log(`Found ${documents.length} documents`);
        const groups = _.groupBy(
          documents, // TODO filter for current user?
          "type"
        );
        console.log(`Found ${_.keys(groups).length} groups`);
        const attachmentData = makeSpreadsheet(template.content, groups);
        const filename = "spreadsheet.xlsx";
        res.header("Content-Disposition", `attachment; filename="${filename}"`);
        res.header("Content-Type", "application/octet-stream");
        res.end(Buffer.from(attachmentData, "binary"));
      });
    }
  });
});

module.exports = router;
