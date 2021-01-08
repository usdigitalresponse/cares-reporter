/* eslint camelcase: 0 */

const knex = require('./connection')
const _ = require('lodash')
const {
  getCurrentReportingPeriodID
} = require('./settings')

async function uploads (period_id) {
  if (!period_id) {
    console.log(`uploads()`)
    period_id = await getCurrentReportingPeriodID()
  }
  return knex('uploads')
    .select('*')
    .where({ 'reporting_period_id': period_id })
    .orderBy('uploads.created_at', 'desc')
}

async function uploadsForAgency (agency_id, period_id) {
  if (!period_id) {
    console.log(`uploadsForAgency()`)
    period_id = await getCurrentReportingPeriodID()
  }

  return knex('uploads')
    .select('*')
    .where({ 'reporting_period_id': period_id })
    .andWhere('agency_id', agency_id)
    .orderBy('created_at', 'desc')
}

function upload (id) {
  return knex('uploads')
    .select('*')
    .where('id', id)
    .then(r => r[0])
}

/*  getUploadSummaries() returns a knex promise containing an array of
    records like this:
    {
      id: 1,
      filename: 'DOA-076-093020-v1.xlsx',
      created_at: 2020-11-19T15:14:34.481Z,
      created_by: 'michael+admin@stanford.cc',
      reporting_period_id: 1,
      user_id: 1,
      agency_id: 3,
      project_id: 48
    }
    */
function getUploadSummaries (period_id) {
  // console.log(`period_id is ${period_id}`)
  return knex('uploads')
    .select('*')
    .where('reporting_period_id', period_id)
}

async function createUpload (upload, queryBuilder = knex) {
  // The CONFLICT should never happen, because the file upload should stop
  // if there is an existing `filename` in the upload directory.
  // However if `filename` gets deleted for some reason without deleting
  // the DB record, it's better to update this record than mysteriously fail.

  const timestamp = new Date().toISOString()
  const qResult = await queryBuilder.raw(
    `INSERT INTO uploads
      (created_by, filename, user_id, created_at, agency_id, project_id, reporting_period_id)
      VALUES
      (:created_by, :filename, :user_id, '${timestamp}', :agency_id, :project_id, :reporting_period_id)
      ON CONFLICT (filename) DO UPDATE
        SET
          created_by = :created_by,
          filename = :filename,
          user_id = :user_id,
          created_at = '${timestamp}',
          agency_id = :agency_id,
          project_id = :project_id,
          reporting_period_id = :reporting_period_id
      RETURNING "id", "created_at"`,
    upload
  )
  const inserted = _.get(qResult, 'rows[0]')
  // This should also never happen, but better to know if it does.
  if (!inserted) throw new Error('Unknown error inserting into uploads table')
  upload.id = inserted.id
  upload.created_at = inserted.created_at
  return upload
}

async function getPeriodUploadIDs (period_id) {
  if (!period_id) {
    period_id = await getCurrentReportingPeriodID()
  }
  let rv
  try {
    rv = await knex('uploads')
      .select('id')
      .where({ 'reporting_period_id': period_id })
      .then(recs => recs.map(rec => rec.id))
  } catch (err) {
    console.log(`knex threw in getPeriodUploadIDs()!`)
    console.dir(err)
  }
  return rv
}

module.exports = {
  getPeriodUploadIDs,
  getUploadSummaries,
  createUpload,
  upload,
  uploads,
  uploadsForAgency
}
