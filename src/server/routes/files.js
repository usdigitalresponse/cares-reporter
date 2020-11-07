const express = require("express");
const fs = require("fs");
const router = express.Router();
const { requireAdminUser } = require("../access-helpers");

router.get("/", requireAdminUser, async function(req, res) {
  fs.readdir(process.env.UPLOAD_DIRECTORY, (err, files) => {
    if (err) {
      res.sendStatus(500);
    } else {
      res.json({ files });
    }
  });
});

router.delete("/:name", requireAdminUser, async function(req, res) {
  const filename = `${process.env.UPLOAD_DIRECTORY}/${req.params.name}`;
  console.log("Deleting:", filename);
  fs.unlinkSync(filename);
  res.sendStatus(204);
});

module.exports = router;
