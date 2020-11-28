const knex = require("./connection");
const _ = require("lodash");

function uploads() {
  return knex("uploads")
    .select("*")
    .join("users", "uploads.user_id", "=", "users.id")
    .select("uploads.*", "users.agency_id")
    .orderBy("uploads.created_at", "desc");
}

function uploadsForAgency(agency_id) {
  return knex("uploads")
    .select("*")
    .where("agency_id", agency_id)
    .orderBy("created_at", "desc");
}

function upload(id) {
  return knex("uploads")
    .select("*")
    .where("id", id)
    .then(r => r[0]);
}

function getUploadSummaries() {
  return knex("uploads")
    .select("*");
}

async function createUpload(upload, queryBuilder = knex) {
  // The CONFLICT should never happen, because the file upload should stop
  // if there is an existing `filename` in the upload directory.
  // However if `filename` gets deleted for some reason without deleting
  // the DB record, it's better to update this record than mysteriously fail.

  const timestamp = new Date().toISOString();
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
  );
  const inserted = _.get(qResult, "rows[0]");
  // This should also never happen, but better to know if it does.
  if (!inserted) throw new Error("Unknown error inserting into uploads table");
  upload.id = inserted.id;
  upload.created_at = inserted.created_at;
  return upload;
}

module.exports = {
  getUploadSummaries,
  createUpload,
  upload,
  uploads,
  uploadsForAgency
};
