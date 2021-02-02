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
const {
  put
} = require('../lib/subrecipients')

router.get('/', requireUser, function get (req, res) {
  subrecipients().then(subrecipients => res.json({ subrecipients }))
})

router.post('/', requireAdminUser, function post (req, res, next) {
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

router.put('/:id', requireAdminUser, async function put (
  req,
  res,
  next
) {
  let subrecipient
  const subrecipientID = (req.params || {}).id
  if (!subrecipientID) {
    return res.status(400).send('Requires a subrecipient ID')
  }
  try {
    subrecipient = await subrecipientById(subrecipientID)
  } catch (err) {
    return res.status(500).send(err.message)
  }
  if (!subrecipient) {
    return res.status(404).send(`Subrecipient ${subrecipientID} not found`)
  }
  if (subrecipient.created_in_period !== null) {
    return res.status(403).send(`Subrecipient ${subrecipientID} not editable`)
  }

  updateSubrecipient(subrecipient, req.body)
    .then(result => {
      return res.json({ subrecipient: result })
    })
    .catch(e => {
      console.log('error!!')
      console.dir(e)
      next(e)
    })
})

module.exports = router

/*                                  *  *  *                                   */
