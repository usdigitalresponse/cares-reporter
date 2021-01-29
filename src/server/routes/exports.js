/* eslint camelcase: 0 */

const express = require('express')
const router = express.Router()
const _ = require('lodash')

const { requireUser } = require('../access-helpers')
const treasury = require('../lib/treasury')
const reportingPeriods = require('../db/reporting-periods')

router.get('/', requireUser, async function (req, res) {
  const period_id = await reportingPeriods.getID(req.query.period_id)

  let report
  // 21 01 29 added force_period to regenerate closed period reports
  if (req.query.force_period) {
    console.log(`Forcing treasury report for period ${req.query.force_period}`)
    report = await treasury.generateReport(req.query.force_period)
    //
  } else if (await reportingPeriods.isCurrent(period_id)) {
    console.log(`period_id ${period_id} is current`)
    report = await treasury.generateReport(period_id)
    //
  } else {
    console.log(`period_id ${period_id} is not current - sending old report`)
    report = await treasury.getPriorReport(period_id)
  }

  if (_.isError(report)) {
    return res.status(500).send(report.message)
  }

  res.header(
    'Content-Disposition',
    `attachment; filename="${report.filename}"`
  )
  res.header('Content-Type', 'application/octet-stream')
  res.send(Buffer.from(report.outputWorkBook, 'binary'))
})

module.exports = router

/*                                  *  *  *                                   */
