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
  let currentPeriodID = await reportingPeriods.getID()
  let allPeriods = await reportingPeriods.getAll()
  let reporting_periods = []

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
  console.log(`GET 2 /reporting_periods/close/`)

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

router.get('/update/', requireAdminUser, async (req, res) => {
  console.log(`GET 2 /reporting_periods/update/`)

  const user = await getUser(req.signedCookies.userId)
  // const period = req.query.period_id;
  const period = 1

  try {
    await reportingPeriods.update(user, period)
  } catch (err) {
    return res.status(500).send(err.message)
  }

  res.json({
    status: 'OK'
  })
})

module.exports = router

/*                                 *  *  *                                    */
