const { v4 } = require("uuid");
const knex = require("./connection");

const {
  createDocument,
  createDocuments,
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

function createUpload(upload, queryBuilder = knex) {
  return queryBuilder
    .insert(upload)
    .into("uploads")
    .returning(["id", "created_at"])
    .then(id => {
      upload.id = id[0].id;
      upload.created_at = id[0].created_at;
      return upload;
    });
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
