require('dotenv').config()

const adminList = (process.env.INITIAL_ADMIN_EMAILS || '').split(/\s*,\s*/)
const agencyUserList = (process.env.INITIAL_AGENCY_EMAILS || '').split(
  /\s*,\s*/
)

exports.seed = async function (knex) {
  // Deletes ALL existing admins
  await knex('users')
    .where({ role: 'admin' })
    .del()
  await knex('users').insert(
    adminList.map(email => {
      return { email, name: email, role: 'admin' }
    })
  )
  await knex('users')
    .where({ role: 'reporter' })
    .del()
  await knex('users').insert(
    agencyUserList.map(email => {
      return { email, name: email, role: 'reporter' }
    })
  )
}
