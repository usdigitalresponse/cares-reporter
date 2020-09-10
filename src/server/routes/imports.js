const express = require("express");
const router = express.Router();
const { requireUser } = require("../access-helpers");
const { user: getUser, upload: getUpload, createDocument } = require("../db");
const { uploadFilename, loadSpreadsheet } = require("../lib/spreadsheet");
const _ = require("lodash");

router.post("/:id", requireUser, function(req, res) {
  console.log("POST /imports/:id", req.params);
  console.log(JSON.stringify(req.body));
  const { id } = req.params;
  const sheets = _.get(req, "body.sheets", []);
  if (_.isEmpty(sheets)) {
    console.log("No sheets");
    res.sendStatus(400);
    res.end();
    return;
  }
  getUser(req.signedCookies.userId).then(user => {
    getUpload(id).then(upload => {
      if (!upload) {
        res.sendStatus(404);
        res.end();
      } else {
        // TODO move most of this to lib/spreadsheet
        const filename = uploadFilename(upload.filename);
        const data = loadSpreadsheet(filename);
        const ps = _.flatMap(sheets, ({ tabName, type, columns }) => {
          const sheet = _.find(data, s => s.name == tabName);
          if (!sheet) {
            return Promise.reject(new Error(`Cannot find sheet ${tabName}`));
          }
          const sheetData = sheet.data;
          return sheetData.slice(1).map(row => {
            const content = _.reduce(
              columns,
              (acc, choice, index) => {
                if (choice != "ignore" && row[index]) {
                  acc[choice] = row[index];
                }
                return acc;
              },
              {}
            );
            if (_.isEmpty(content)) {
              return null;
            }
            const document = {
              type,
              content,
              upload_id: id,
              user_id: user.id
            };
            console.log("creating document:", document);
            return createDocument(document);
          });
        });
        Promise.all(ps)
          .then(_.compact)
          .then(documents => {
            res.json({ documents });
          })
          .catch(e => {
            console.log(e.message);
            res.sendStatus(400);
          });
      }
    });
  });
});

module.exports = router;
