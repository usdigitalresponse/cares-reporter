/* eslint camelcase: 0 */

const express = require('express')
const router = express.Router()
const _ = require('lodash')

const { requireUser } = require('../access-helpers')
const auditReport = require('../lib/audit-report')

router.get('/', requireUser, async function (req, res) {
  console.log('/api/audit-report GET')
  const report = await auditReport.generate()

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
