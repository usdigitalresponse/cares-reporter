require("dotenv").config();

const adminList = (process.env.INITIAL_ADMIN_EMAILS || "").split(/\s*,\s*/);

exports.seed = async function(knex) {
  // Deletes ALL existing admins
  await knex("users")
    .where({ role: "admin" })
    .del();
  return knex("users").insert(
    adminList.map(email => {
      return { email, name: email, role: "admin" };
    })
  );
};
