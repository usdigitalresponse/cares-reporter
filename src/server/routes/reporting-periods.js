/*
--------------------------------------------------------------------------------
-                         routes/reporting-periods.js
--------------------------------------------------------------------------------

*/
/* eslint camelcase: 0 */

const express = require('express')
const router = express.Router()

const { requireUser, requireAdminUser } = require('../access-helpers')
const { getPeriodSummaries, user: getUser } = require('../db')
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

  return res.json({ reporting_periods, all_reporting_periods: allPeriods })
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

function validateReportingPeriod(req, res, next) {
  next()
}

router.post('/', requireAdminUser, validateReportingPeriod, function (req, res, next) {
  console.log('POST /reporting_periods', req.body)
  const { name, start_date, end_date } = req.body
  const reportingPeriod = {
    name,
    start_date,
    end_date
  }
  reportingPeriods.createReportingPeriod(reportingPeriod)
    .then(result => res.json({ reportingPeriod: result }))
    .catch(e => {
      next(e)
    })
})

router.put('/:id', requireAdminUser, validateReportingPeriod, async function (
  req,
  res,
  next
) {
  console.log('PUT /reporting_periods/:id', req.body)
  let reportingPeriod = await reportingPeriods.reportingPeriodById(req.params.id)
  if (!reportingPeriod) {
    res.status(400).send('Reporting period not found')
    return
  }
  const { name, start_date, end_date } = req.body
  project = {
    ...reportingPeriod,
    name,
    start_date,
    end_date
  }
  reportingPeriods.updateReportingPeriod(project)
    .then(result => res.json({ reportingPeriod: result }))
    .catch(e => {
      next(e)
    })
})

module.exports = router

/*                                 *  *  *                                    */
