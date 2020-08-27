const express = require("express");
const router = express.Router();
const { requireUser } = require("../access-helpers");
const { user, upload, uploads, createUpload } = require("../db");
const { uploadFilename, loadSpreadsheet } = require("../lib/spreadsheet");

router.get("/", requireUser, function(req, res) {
  uploads().then(uploads => res.json({ uploads }));
});

router.post("/", requireUser, function(req, res, next) {
  console.log("POST /api/uploads");
  const { configuration_id } = req.body;
  let spreadsheet = req.files.spreadsheet;
  user(req.signedCookies.userId).then(user => {
    // FIXME verify name exists and has xlsx extension
    const destination = uploadFilename(spreadsheet.name);
    console.log(spreadsheet.name, destination);
    spreadsheet.mv(destination, err => {
      if (err) {
        next(err);
      } else {
        const upload = {
          filename: spreadsheet.name,
          configuration_id,
          created_by: user.email
        };
        return createUpload(upload)
          .then(result => {
            res.json({ success: true, upload: result });
          })
          .catch(e => {
            next(e);
          });
      }
    });
  });
});

router.get("/:id", requireUser, (req, res) => {
  const { id } = req.params;
  upload(id).then(upload => {
    if (!upload) {
      res.sendStatus(404);
      res.end();
    } else {
      const filename = uploadFilename(upload.filename);
      const data = loadSpreadsheet(filename);
      res.json({ id, filename, data });
    }
  });
});

module.exports = router;
