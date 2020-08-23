const express = require("express");
const router = express.Router();
const { requireUser } = require("../access-helpers");
const { user, documents, createDocument } = require("../db");

router.get("/", requireUser, function(req, res) {
  documents().then(documents => res.json({ documents }));
});

router.post("/:type", requireUser, function(req, res) {
  console.log("POST /documents/:type", req.params.type, req.body);
  console.log("userId:", req.signedCookies.userId);
  user(req.signedCookies.userId).then(user => {
    const document = {
      type: req.params.type,
      content: req.body,
      created_by: user.email
    };
    createDocument(document).then(result => res.json({ document: result }));
  });
});

module.exports = router;
