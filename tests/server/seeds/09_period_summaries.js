require("dotenv").config();

exports.seed = async function(knex) {
  await knex("period_summaries").del();
  await knex("period_summaries").insert([
    {
      project_code: "075",
      award_type: "contracts",
      award_number: "3568971",
      reporting_period_id: 2,
      current_obligation: 50000.00,
      current_expenditure: 0.00
    },
    {
      project_code: "075",
      award_type: "direct",
      award_number: "1551",
      reporting_period_id: 2,
      current_obligation: 100000000.00,
      current_expenditure: 0.00
    }
  ]);
};
