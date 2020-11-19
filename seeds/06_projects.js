require("dotenv").config();

exports.seed = async function(knex) {
  await knex("projects").del();
  const ids = await knex("projects")
    .insert([
      {
        code: "075",
        name: "Workforce Stabilization Loan Program Disbursements #1, #2, and #3"
      },
      {
        code: "1020",
        name: "Testing"
      }
    ])
    .returning("id");
};
