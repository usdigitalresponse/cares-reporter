const { v4 } = require("uuid");
const knex = require("./connection");

const {
  createDocument,
  createDocuments,
  deleteDocuments,
  documents,
  documentsForAgency,
  documentsWithProjectCode
} = require("./documents");

const {
  currentReportingPeriodSettings,
  applicationSettings
} = require("./settings");

const reportingPeriods = require("./reporting-periods");

const {
  getPeriodSummaries
} = require("./period-summaries");


const {
  createUpload,
  upload,
  uploads,
  uploadsForAgency
} = require("./uploads");

const {
  createProject,
  fixProjectCode,
  getProject,
  getProjects,
  projectByCode,
  projects,
  updateProject,
  updateProjectStatus
} = require("./projects");

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

function updateUser(user) {
  return knex("users")
    .where("id", user.id)
    .update({
      email: user.email,
      name: user.name,
      role: user.role,
      agency_id: user.agency_id
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
      "users.agency_id",
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

function agencies() {
  return knex("agencies")
    .select("*")
    .orderBy("name");
}

function agencyById(id) {
  return knex("agencies")
    .select("*")
    .where("id", id)
    .then(r => r[0]);
}

function agencyByCode(code) {
  return knex("agencies")
    .select("*")
    .where({ code });
}

function createAgency(agency) {
  return knex
    .insert(agency)
    .into("agencies")
    .returning(["id"])
    .then(response => {
      return {
        ...agency,
        id: response[0].id
      };
    });
}

function updateAgency(agency) {
  return knex("agencies")
    .where("id", agency.id)
    .update({
      code: agency.code,
      name: agency.name
    });
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
  agencyById,
  applicationSettings,
  createAccessToken,
  createAgency,
  createDocument,
  createDocuments,
  createProject,
  createUpload,
  createUser,
  currentReportingPeriodSettings,
  deleteDocuments,
  documents,
  documentsForAgency,
  documentsWithProjectCode,
  fixProjectCode,
  getPeriodSummaries,
  getProject,
  getProjects,
  knex,
  markAccessTokenUsed,
  projectByCode,
  projects,
  reportingPeriods,
  roles,
  transact,
  updateAgency,
  updateProject,
  updateProjectStatus,
  updateUser,
  upload,
  uploads,
  uploadsForAgency,
  user,
  userAndRole,
  users
};
