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

module.exports = {
  getSubRecipients,
  getSubRecipientsByPeriod,
  setSubRecipient,
  subrecipients
}

/*                                 *  *  *                                    */
