const express = require("express");
const { requireUser } = require("../access-helpers");

const router = express.Router();
const { reportingPeriods } = require("../db");

router.get("/", requireUser, function(req, res) {
  reportingPeriods().then(reporting_periods => res.json({ reporting_periods }));
});

module.exports = router;
