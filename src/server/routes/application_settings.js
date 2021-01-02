/* eslint camelcase: 0 */

const express = require('express')

const router = express.Router()
const { applicationSettings } = require('../db')

router.get('/', function (req, res) {
  applicationSettings().then(application_settings =>
    res.json({ application_settings })
  )
})

module.exports = router
