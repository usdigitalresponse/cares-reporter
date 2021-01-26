/*
--------------------------------------------------------------------------------
-                         routes/reporting-periods.js
--------------------------------------------------------------------------------

*/
/* eslint camelcase: 0 */

const express = require('express')
const router = express.Router()

const { requireUser, requireAdminUser } = require('../access-helpers')
const { user: getUser } = require('../db')
const { getPeriodSummaries } = require('../db')
const reportingPeriods = require('../db/reporting-periods')

router.get('/', requireUser, async function (req, res) {
  const currentPeriodID = await reportingPeriods.getID()
  const allPeriods = await reportingPeriods.getAll()
  const reporting_periods = []

  allPeriods.forEach(period => {
    if (period.id <= currentPeriodID) {
      reporting_periods[period.id - 1] = period
    }
  })

  return res.json({ reporting_periods })
})

router.get('/summaries/', requireUser, async function (req, res) {
  return getPeriodSummaries().then(summaries => res.json({ summaries }))
})

router.get('/close/', requireAdminUser, async (req, res) => {
  console.log('GET 2 /reporting_periods/close/')

  const user = await getUser(req.signedCookies.userId)

  try {
    await reportingPeriods.close(user)
  } catch (err) {
    return res.status(500).send(err.message)
  }

  res.json({
    status: 'OK'
  })
})

module.exports = router

/*                                 *  *  *                                    */
