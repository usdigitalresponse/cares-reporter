const express = require("express");
const { requireUser } = require("../access-helpers");

const router = express.Router();
const { applicationSettings } = require("../db");

router.get("/", requireUser, function(req, res) {
  applicationSettings().then(application_settings =>
    res.json({ application_settings })
  );
});

module.exports = router;
