const db = process.env.POSTGRES_URL;
const { v4 } = require("uuid");

console.log("Connecting to database:", db);
const knex = require("knex")({
  client: "pg",
  connection: db
});

function users() {
  return knex("users")
    .select("*")
    .orderBy("email");
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
    .orderBy("name");
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
    .orderBy("created_at");
}

function upload(id) {
  return knex("uploads")
    .select("*")
    .where("id", id)
    .then(r => r[0]);
}

function accessToken(passcode) {
  console.log("passcode:", passcode);
  return knex("access_tokens")
    .select("*")
    .where("passcode", passcode)
    .then(r => r[0]);
}

function generatePasscode(email) {
  console.log("generatePasscode for :", email);
  return new Promise((resolve, reject) => {
    knex("users")
      .select("*")
      .where("email", email)
      .then(users => {
        if (users.length == 0) {
          return reject(new Error(`User '${email}' not found`));
        }
        const passcode = v4();
        const used = false;
        const expiryMinutes = 30;
        var expires = new Date();
        expires.setMinutes(expires.getMinutes() + expiryMinutes);
        knex("access_tokens")
          .insert({ user_id: users[0].id, passcode, expires, used })
          .then(() => resolve(passcode));
      });
  });
}

function createAccessToken(email) {
  return generatePasscode(email);
}

function documents() {
  return knex("documents")
    .select("*")
    .limit(1000);
}

function createDocument(document) {
  return knex
    .insert(document)
    .into("documents")
    .returning("id")
    .then(id => {
      const result = {
        ...document,
        id: id[0]
      };
      return result;
    });
}

function createUpload(upload) {
  return knex
    .insert(upload)
    .into("uploads")
    .returning(["id", "created_at"])
    .then(id => {
      upload.id = id[0].id;
      upload.created_at = id[0].created_at;
      return upload;
    });
}

module.exports = {
  accessToken,
  createAccessToken,
  createDocument,
  createUpload,
  documents,
  roles,
  tables,
  template,
  templates,
  upload,
  uploads,
  user,
  userAndRole,
  users
};
