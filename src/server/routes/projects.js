const express = require("express");
const { requireUser } = require("../access-helpers");

const router = express.Router();
const { projects } = require("../db");

router.get("/", requireUser, function(req, res) {
  projects().then(projects => res.json({ projects }));
});

module.exports = router;
