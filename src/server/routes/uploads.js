const express = require("express");

const router = express.Router();
const { requireUser } = require("../access-helpers");
const { upload, uploads } = require("../db");
const { uploadFilename, loadSpreadsheet } = require("../lib/spreadsheet");
const { processUpload } = require("../services/process_upload");
const multer = require("multer");
const multerUpload = multer({ storage: multer.memoryStorage() });

router.get("/", requireUser, function(req, res) {
  uploads().then(uploads => res.json({ uploads }));
});

router.post(
  "/",
  requireUser,
  multerUpload.single("spreadsheet"),
  async (req, res, next) => {
    console.log("POST /api/uploads");
    try {
      const { valog, upload } = await processUpload({
        filename: req.file.originalname,
        configuration_id: req.body.configuration_id,
        user_id: req.signedCookies.userId,
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

module.exports = router;
