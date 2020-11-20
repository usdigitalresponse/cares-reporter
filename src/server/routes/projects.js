const express = require("express");
const { requireUser } = require("../access-helpers");

const router = express.Router();
const { projects } = require("../db");

router.get("/", requireUser, function(req, res) {
  projects().then(projects => res.json({ projects }));
});

router.post("/", requireUser, function(req, res) {
  res.json({ project: {} });
});

router.put("/:id", requireUser, function(req, res) {
  res.json({ project: {} });
});

module.exports = router;
