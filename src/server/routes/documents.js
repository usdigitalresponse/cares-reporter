const express = require("express");
const router = express.Router();
const ssf = require("ssf");
const { requireUser } = require("../access-helpers");
const {
  user: getUser,
  documentsWithProjectCode,
  documents: getDocuments,
  documentsForAgency,
  createDocument
} = require("../db");
const _ = require("lodash");

function formatDates(document) {
  const keys = _.keys(document.content);
  keys.forEach(k => {
    if (_.includes(k, "date")) {
      const value = document.content[k];
      if (_.isNumber(value)) {
        document.content[k] = ssf.format("MM/dd/yyyy", value);
      }
    }
  });
  return document;
}

router.get("/", requireUser, async function(req, res) {
  const user = await getUser(req.signedCookies.userId);
  const rawDocuments = user.agency_id
    ? await documentsForAgency(user.agency_id)
    : await documentsWithProjectCode();
  const documents = rawDocuments.map(formatDates);
  return res.json({ documents });
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
