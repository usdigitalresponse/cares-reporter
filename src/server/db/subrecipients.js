/* migration file for subrecipients table:
    migrations/20201204142859_add_subrecipients_table.js

                Table "public.subrecipients"
            Column         |           Type           |
    -----------------------+--------------------------+
     id                    | integer                  |
     identification_number | text                     |
     duns_number           | text                     |
     legal_name            | text                     |
     address_line_1        | text                     |
     address_line_2        | text                     |
     address_line_3        | text                     |
     city_name             | text                     |
     state_code            | text                     |
     zip                   | text                     |
     country_name          | text                     |
     organization_type     | text                     |
     created_at            | timestamp with time zone |
     created_by            | text                     |
     updated_at            | timestamp with time zone |
     updated_by            | text                     |
     created_in_period     | integer                  |
  */
/* eslint camelcase: 0 */

const knex = require('./connection')
const { getCurrentReportingPeriodID } = require('./settings')

function subrecipients () {
  return knex('subrecipients')
    .select('*')
    .orderBy('legal_name')
}

function subrecipients () {
  return knex('subrecipients')
    .select('*')
    .orderBy('legal_name')
}

async function getSubRecipients () {
  let records = await knex('subrecipients')
    .select('*')

  records = records.map(record => respace(record))

  const mapSubrecipients = new Map() // subrecipient id : <subrecipient record>
  records.forEach(subrecipientRecord => {
    mapSubrecipients.set(
      subrecipientRecord['identification number'],
      subrecipientRecord
    )
  })

  return mapSubrecipients
}

async function getSubRecipientsByPeriod (period_id) {
  console.log(`getting subrecipients from period ${period_id}`)
  const records = await knex('subrecipients')
    .select('*')
    .where('created_in_period', period_id)
  // console.dir(records)
  return records.map(record => respace(record))
}

async function setSubRecipient (record) {
  record = despace(record)

  try {
    await knex('subrecipients').insert(record)
    // let result = await knex("subrecipients").insert(record);
    // console.dir(result);
  } catch (err) {
    console.dir(err)
  }
}

/* despace() replaces spaces with underscores in an object's keys
  */
function despace (obj) {
  const keys = Object.keys(obj)
  const _keys = keys.map(key => key.trim().replace(/ /g, '_'))
  const _obj = {}
  keys.forEach((k, i) => { _obj[_keys[i]] = obj[keys[i]] })
  return _obj
}

/* respace() replaces underscores with spaces in an object's keys
  */
function respace (_obj) {
  const _keys = Object.keys(_obj)
  const keys = _keys.map(_key => _key.replace(/_/g, ' '))
  const obj = {}
  _keys.forEach((k, i) => { obj[keys[i]] = _obj[_keys[i]] })
  return obj
}

function subrecipientById (id) {
  return knex('subrecipients')
    .select('*')
    .where({ id })
    .then(r => r[0])
}

async function createSubrecipient (subrecipient) {
  subrecipient.created_in_period = await getCurrentReportingPeriodID()
  return knex
    .insert(subrecipient)
    .into('subrecipient')
    .returning(['id'])
    .then(response => {
      return {
        ...subrecipient,
        id: response[0].id
      }
    })
}

function updateSubrecipient (subrecipient) {
  return knex('subrecipients')
    .where('id', subrecipient.id)
    .update({
      identification_number: subrecipient.identification_number,
      duns_number: subrecipient.duns_number,
      legal_name: subrecipient.legal_name,
      address_line_1: subrecipient.address_line_1,
      address_line_2: subrecipient.address_line_2,
      address_line_3: subrecipient.address_line_3,
      city_name: subrecipient.city_name,
      state_code: subrecipient.state_code,
      zip: subrecipient.zip,
      country_name: subrecipient.country_name,
      organization_type: subrecipient.organization_type
    })
}

module.exports = {
  getSubRecipients,
  getSubRecipientsByPeriod,
  setSubRecipient,
  subrecipients,
  createSubrecipient,
  updateSubrecipient,
  subrecipientById
}

/*                                 *  *  *                                    */
