const express = require("express");
const router = express.Router();
const { requireUser } = require("../access-helpers");
const { documentsInCurrentReportingPeriod } = require("../db");
const { getTemplate } = require("../services/get-template");
const { makeConfig, makeTemplate } = require("../lib/config");
const { makeSpreadsheet } = require("../lib/spreadsheet");
const _ = require("lodash");

router.get("/", requireUser, function(req, res) {
  const treasuryTemplate = getTemplate(`treasury`);
  const config = makeConfig(treasuryTemplate, "Treasury Template", []);
  const template = makeTemplate(config, "Treasury Template");

  if (!template) {
    res.sendStatus(500);
  } else {
    documentsInCurrentReportingPeriod()
      .then(
        documents => {
          console.log(`Found ${documents.length} documents`);
          const groups = _.groupBy(documents, "type");
          console.log(`Found ${_.keys(groups).length} groups:`);

          makeSpreadsheet(template.content, groups).then(attachmentData => {
            const filename = `${template.name}.xlsx`;
            res.header(
              "Content-Disposition",
              `attachment; filename="${filename}"`
            );
            res.header("Content-Type", "application/octet-stream");
            res.send(Buffer.from(attachmentData, "binary"));
          });
        },
        () => res.sendStatus(500)
      )
      .catch(() => res.sendStatus(500));
  }
});

module.exports = router;
