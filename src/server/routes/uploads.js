const express = require("express");

const router = express.Router();
const { requireUser } = require("../access-helpers");
const { user, upload, uploads, createUpload } = require("../db");
const { uploadFilename, loadSpreadsheet } = require("../lib/spreadsheet");
const multer = require("multer");
const multerUpload = multer({ storage: multer.memoryStorage() });
const FileInterface = require("../lib/serverDiskInterface");
const fileInterface = new FileInterface();

router.get("/", requireUser, function(req, res) {
  uploads().then(uploads => res.json({ uploads }));
});

router.post(
  "/",
  requireUser,
  multerUpload.single("spreadsheet"),
  async function(req, res, next) {
    console.log("POST /api/uploads");
    try {
      const { configuration_id } = req.body;
      await fileInterface.writeFile(req.file.originalname, req.file.buffer);
      const currentUser = await user(req.signedCookies.userId);
      const upload = {
        filename: req.file.originalname,
        configuration_id,
        created_by: currentUser.email
      };
      const result = await createUpload(upload);
      res.json({ success: true, upload: result });
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
