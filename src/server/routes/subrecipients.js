/*
--------------------------------------------------------------------------------
-                           routes/subrecipients.js
--------------------------------------------------------------------------------
*/
/* eslint camelcase: 0 */

const express = require('express')
const { requireUser } = require('../access-helpers')

const router = express.Router()
const {
  subrecipients
} = require('../db/subrecipients')

router.get('/', requireUser, function (req, res) {
  subrecipients().then(subrecipients => res.json({ subrecipients }))
})

module.exports = router
