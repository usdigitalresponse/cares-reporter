const express = require("express");
const router = express.Router();
const { requireUser } = require("../access-helpers");
const {
  user: getUser,
  documents,
  documentsForAgency,
  createDocument
} = require("../db");

router.get("/", requireUser, async function(req, res) {
  const user = await getUser(req.signedCookies.userId);
  if (user.agency_id) {
    return documentsForAgency(user.agency_id).then(documents =>
      res.json({ documents })
    );
  } else {
    return documents().then(documents => res.json({ documents }));
  }
});

router.post("/:type", requireUser, function(req, res) {
  console.log("POST /documents/:type", req.params.type, req.body);
  console.log("userId:", req.signedCookies.userId);
  getUser(req.signedCookies.userId).then(user => {
    const document = {
      type: req.params.type,
      content: req.body,
      user_id: user.id
    };
    createDocument(document).then(result => res.json({ document: result }));
  });
});

module.exports = router;
