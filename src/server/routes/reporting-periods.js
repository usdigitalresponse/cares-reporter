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
  getPeriodSummaries
} = require("../db");
const {
  getPeriodID,
  reportingPeriods
} = require("../db/reporting-periods");

router.get("/", requireUser, async function(req, res) {
  let currentPeriodID = await getPeriodID();
  let allPeriods = await reportingPeriods();
  let reporting_periods=[];

  allPeriods.forEach(period => {
    if (period.id <= currentPeriodID){
      reporting_periods[period.id-1]=period;
    }
  });

  return res.json({ reporting_periods });
});

router.get("/summaries/", requireUser, async function(req, res) {
  return getPeriodSummaries().then(summaries => res.json({ summaries }));
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
