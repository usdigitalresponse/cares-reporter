/*
--------------------------------------------------------------------------------
-                         routes/reporting-periods.js
--------------------------------------------------------------------------------

*/

const express = require("express");
const router = express.Router();

const { requireUser, requireAdminUser } = require("../access-helpers");
const { user: getUser } = require("../db");

const {
  periodSummaries,
  reportingPeriods
} = require("../db");

router.get("/", requireUser, function(req, res) {
  reportingPeriods().then(reporting_periods => res.json({ reporting_periods }));
});

router.get("/summaries/", requireUser, async function(req, res) {
  return periodSummaries().then(summaries => res.json({ summaries }));
});

router.post("/close/", requireAdminUser, async (req, res) => {
  console.log(`POST /period-summaries/`);

  const user = await getUser(req.signedCookies.userId);

  let err = await reportingPeriods.close(user);

  res.json({
    status: "OK"
  });
});

module.exports = router;

/*                                 *  *  *                                    */
