// uploads.js handles uploading an agency report spreadsheet to the database.

const express = require("express");
const fs = require("fs");

const router = express.Router();
const { requireUser } = require("../access-helpers");
const { user: getUser, upload, uploads, uploadsForAgency } = require("../db");
const { uploadFilename, loadSpreadsheet } = require("../lib/spreadsheet");
const { processUpload } = require("../services/process-upload");
const { getPeriodID } = require("../db/reporting-periods");

const multer = require("multer");
const multerUpload = multer({ storage: multer.memoryStorage() });

router.get("/", requireUser, async function(req, res) {
  const period_id = await getPeriodID(req.query.period_id);
  const user = await getUser(req.signedCookies.userId);
  const docs = user.agency_id
    ? await uploadsForAgency(user.agency_id, period_id)
    : await uploads(period_id);
  return res.json({ uploads: docs });
});

router.post(
  "/",
  requireUser,
  multerUpload.single("spreadsheet"),
  async (req, res, next) => {
    console.log("POST /api/uploads");
    if (req.file) {
      console.log("Filename:", req.file.originalname, "size:", req.file.size);
    }
    const user = await getUser(req.signedCookies.userId);
    try {
      const { valog, upload } = await processUpload({
        filename: req.file.originalname,
        user_id: req.signedCookies.userId,
        agency_id: user.agency_id,
        data: req.file.buffer
      });
      res.json({
        success: valog.success(),
        errors: valog.getLog(),
        upload
      });
    } catch (e) {
      next(e);
    }
  }
);

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

router.get("/download/:id", requireUser, (req, res) => {
  const { id } = req.params;
  upload(id).then(upload => {
    if (!upload) {
      res.sendStatus(404);
      res.end();
    } else {
      const filename = uploadFilename(upload.filename);
      const attachmentData = fs.readFileSync(filename);
      res.header(
        "Content-Disposition",
        `attachment; filename="${upload.filename}"`
      );
      res.header("Content-Type", "application/octet-stream");
      res.end(Buffer.from(attachmentData, "binary"));
    }
  });
});

module.exports = router;
