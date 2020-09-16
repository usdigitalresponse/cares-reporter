const { v4 } = require("uuid");
const knex = require("./connection");
const _ = require("lodash");

const {
  createDocument,
  createDocuments,
  deleteDocuments,
  documents,
  documentsForAgency
} = require("./documents");

function users() {
  return knex("users")
    .select("*")
    .orderBy("email");
}

function createUser(user) {
  return knex
    .insert(user)
    .into("users")
    .returning(["id", "created_at"])
    .then(response => {
      return {
        ...user,
        id: response[0].id,
        created_at: response[0].created_at
      };
    });
}

function user(id) {
  return knex("users")
    .select("*")
    .where("id", id)
    .then(r => r[0]);
}

function userAndRole(id) {
  return knex("users")
    .join("roles", "roles.name", "users.role")
    .select(
      "users.id",
      "users.email",
      "users.role",
      "users.tags",
      "roles.rules"
    )
    .where("users.id", id)
    .then(r => r[0]);
}

function roles() {
  return knex("roles")
    .select("*")
    .orderBy("name");
}

function tables() {
  return knex("configurations")
    .select("*")
    .where("type", "tables")
    .orderBy("sort_order");
}

function templates() {
  return knex("configurations")
    .select("*")
    .where("type", "templates")
    .orderBy("name");
}

function template(id) {
  return knex("configurations")
    .select("*")
    .where({ type: "templates", id })
    .then(r => r[0]);
}

function uploads() {
  return knex("uploads")
    .select("*")
    .orderBy("created_at", "desc");
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

function accessToken(passcode) {
  return knex("access_tokens")
    .select("*")
    .where("passcode", passcode)
    .then(r => r[0]);
}

function markAccessTokenUsed(passcode) {
  return knex("access_tokens")
    .where("passcode", passcode)
    .update({ used: true });
}

async function generatePasscode(email) {
  console.log("generatePasscode for :", email);
  const users = await knex("users")
    .select("*")
    .where("email", email);
  if (users.length === 0) {
    throw new Error(`User '${email}' not found`);
  }
  const passcode = v4();
  const used = false;
  const expiryMinutes = 30;
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + expiryMinutes);
  await knex("access_tokens").insert({
    user_id: users[0].id,
    passcode,
    expires,
    used
  });
  return passcode;
}

function createAccessToken(email) {
  return generatePasscode(email);
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

function agencies() {
  return knex("agencies")
    .select("*")
    .orderBy("name");
}

function agencyByCode(code) {
  return knex("agencies")
    .select("*")
    .where({ code });
}

function projects() {
  return knex("projects")
    .select("*")
    .orderBy("name");
}

function reportingPeriods() {
  return knex("reporting_periods")
    .select("*")
    .orderBy("end_date", "desc");
}

function applicationSettings() {
  return knex("application_settings")
    .select("*")
    .then(r => r[0]);
}

async function transact(callback) {
  let result;
  await knex.transaction(async queryBuilder => {
    result = await callback(queryBuilder);
  });
  return result;
}

module.exports = {
  accessToken,
  agencies,
  agencyByCode,
  applicationSettings,
  createAccessToken,
  createDocument,
  createDocuments,
  createUpload,
  createUser,
  deleteDocuments,
  documents,
  documentsForAgency,
  markAccessTokenUsed,
  projects,
  reportingPeriods,
  roles,
  tables,
  template,
  templates,
  transact,
  upload,
  uploads,
  uploadsForAgency,
  user,
  userAndRole,
  users
};
