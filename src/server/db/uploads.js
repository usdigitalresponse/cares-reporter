const knex = require("./connection");
const _ = require("lodash");

function uploads() {
  return knex("uploads")
    .select("*")
    .orderBy("created_at", "desc");
}

function uploadsForAgency(agency_id) {
  return knex("uploads")
    .join("users", "uploads.user_id", "=", "users.id")
    .select("uploads.*")
    .where("users.agency_id", agency_id)
    .orderBy("uploads.created_at", "desc");
}

function upload(id) {
  return knex("uploads")
    .select("*")
    .where("id", id)
    .then(r => r[0]);
}

async function createUpload(upload, queryBuilder = knex) {
  // The CONFLICT should never happen, because the file upload should stop
  // if there is an existing `filename` in the upload directory.
  // However if `filename` gets deleted for some reason without deleting
  // the DB record, it's better to update this record than mysteriously fail.

  const timestamp = new Date().toISOString();
  const qResult = await queryBuilder.raw(
    `INSERT INTO uploads
      (configuration_id, created_by, filename, user_id, created_at)
      VALUES
      (:configuration_id, :created_by, :filename, :user_id, '${timestamp}')
      ON CONFLICT (filename) DO UPDATE
        SET 
          configuration_id = :configuration_id,
          created_by = :created_by,
          filename = :filename,
          user_id = :user_id,
          created_at = '${timestamp}'
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
  createUpload,
  upload,
  uploads,
  uploadsForAgency
};
