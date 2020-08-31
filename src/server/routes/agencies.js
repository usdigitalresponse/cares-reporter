const express = require("express");
const { requireUser } = require("../access-helpers");

const router = express.Router();
const { agencies } = require("../db");

router.get("/", requireUser, function(req, res) {
  agencies().then(agencies => res.json({ agencies }));
});

module.exports = router;
