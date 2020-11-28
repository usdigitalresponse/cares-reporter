const express = require("express");
const { requireAdminUser, requireUser } = require("../access-helpers");

const router = express.Router();
const {
  agencies,
  agencyById: getAgency,
  createAgency,
  updateAgency
} = require("../db");

router.get("/", requireUser, function(req, res) {
  agencies().then(agencies => res.json({ agencies }));
});

async function validateAgency(req, res, next) {
  const { name, code } = req.body;
  if (!name) {
    res.status(400).send("Agency requires a name");
    return;
  }
  if (!code) {
    res.status(400).send("Agency requires a code");
    return;
  }
  next();
}

router.post("/", requireAdminUser, validateAgency, function(req, res, next) {
  console.log("POST /agencies", req.body);
  const { code, name } = req.body;
  const agency = {
    code,
    name
  };
  createAgency(agency)
    .then(result => res.json({ agency: result }))
    .catch(e => {
      if (e.message.match(/violates unique constraint/)) {
        res.status(400).send("Agency with that code already exists");
      } else {
        next(e);
      }
    });
});

router.put("/:id", requireAdminUser, validateAgency, async function(
  req,
  res,
  next
) {
  console.log("PUT /agencies/:id", req.body);
  let agency = await getAgency(req.params.id);
  if (!agency) {
    res.status(400).send("Agency not found");
    return;
  }
  const { code, name } = req.body;
  agency = {
    ...agency,
    code,
    name
  };
  updateAgency(agency)
    .then(result => res.json({ agency: result }))
    .catch(e => {
      if (e.message.match(/violates unique constraint/)) {
        res.status(400).send("Agency with that code already exists");
      } else {
        next(e);
      }
    });
});

module.exports = router;
