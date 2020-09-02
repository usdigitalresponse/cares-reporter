const express = require("express");
const router = express.Router();
const { requireUser } = require("../access-helpers");
const { user: getUser } = require("../db");
const {
  user,
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
  user(req.signedCookies.userId).then(user => {
    const document = {
      type: req.params.type,
      content: req.body,
      created_by: user.email,
      user_id: user.id,
      agency_id: user.agency_id
    };
    createDocument(document).then(result => res.json({ document: result }));
  });
});

module.exports = router;
