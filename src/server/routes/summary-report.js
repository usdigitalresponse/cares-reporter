/* eslint camelcase: 0 */

const express = require('express')
const router = express.Router()
const _ = require('lodash')

const { requireUser } = require('../access-helpers')
const summaryReport = require('../lib/summary-report')

router.get('/', requireUser, async function (req, res) {
  let report = await summaryReport.generate()

  if (_.isError(report)) {
    return res.status(500).send(report.message)
  }
  return res.status(200).send('OK')
  // res.header(
  //   'Content-Disposition',
  //   `attachment; filename="${report.filename}"`
  // )
  // res.header('Content-Type', 'application/octet-stream')
  // res.send(Buffer.from(report.outputWorkBook, 'binary'))
})

module.exports = router

/*                                  *  *  *                                   */
