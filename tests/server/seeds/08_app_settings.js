require('dotenv').config()

exports.seed = async function (knex) {
  await knex('application_settings').del()
  await knex('application_settings').insert([
    { title: 'Rhode Island', current_reporting_period_id: 1 }
  ])
}
