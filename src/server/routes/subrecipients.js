/*
--------------------------------------------------------------------------------
-                           routes/subrecipients.js
--------------------------------------------------------------------------------
*/
/* eslint camelcase: 0 */

const express = require('express')
const { requireAdminUser, requireUser } = require('../access-helpers')

const router = express.Router()
const {
  subrecipients,
  subrecipientById,
  createSubrecipient,
  updateSubrecipient
} = require('../db/subrecipients')

router.get('/', requireUser, function (req, res) {
  subrecipients().then(subrecipients => res.json({ subrecipients }))
})

router.post('/', requireAdminUser, function (req, res, next) {
  console.log('POST /subrecipients', req.body)
  const {
    identification_number,
    duns_number,
    legal_name,
    address_line_1,
    address_line_2,
    address_line_3,
    city_name,
    state_code,
    zip,
    country_name,
    organization_type
  } = req.body
  const subrecipient = {
    identification_number,
    duns_number,
    legal_name,
    address_line_1,
    address_line_2,
    address_line_3,
    city_name,
    state_code,
    zip,
    country_name,
    organization_type
  }
  createSubrecipient(subrecipient)
    .then(result => res.json({ subrecipient: result }))
    .catch(e => {
      next(e)
    })
})

router.put('/:id', requireAdminUser, async function (
  req,
  res,
  next
) {
  console.log('PUT /subrecipiens/:id', req.body)
  let subrecipient = await subrecipientById(req.params.id)
  if (!subrecipient) {
    res.status(400).send('Subrecipient not found')
    return
  }
  const {
    identification_number,
    duns_number,
    legal_name,
    address_line_1,
    address_line_2,
    address_line_3,
    city_name,
    state_code,
    zip,
    country_name,
    organization_type
  } = req.body
  subrecipient = {
    ...subrecipient,
    identification_number,
    duns_number,
    legal_name,
    address_line_1,
    address_line_2,
    address_line_3,
    city_name,
    state_code,
    zip,
    country_name,
    organization_type
  }
  updateSubrecipient(subrecipient)
    .then(result => res.json({ subrecipient: result }))
    .catch(e => {
      next(e)
    })
})

module.exports = router
