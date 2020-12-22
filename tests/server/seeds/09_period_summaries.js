require("dotenv").config();

exports.seed = async function(knex) {
  await knex("period_summaries").del();
  await knex("period_summaries").insert([
    {
      project_code: "075",
      award_type: "contracts",
      award_number: "3568971",
      reporting_period_id: 1,
      current_obligation: 50000.00,
      current_expenditure: 0.00
    },
    {
      project_code: "075",
      award_type: "direct",
      award_number: "1551",
      reporting_period_id: 1,
      current_obligation: 100000000.00,
      current_expenditure: 0.00
    },
    {
      project_code: "075",
      award_type: "grants",
      award_number: "1234",
      reporting_period_id: 1,
      current_obligation: 10000000.00,
      current_expenditure: 0.00
    },
    {
      project_code: "075",
      award_type: "loans",
      award_number: "2706353",
      reporting_period_id: 1,
      current_obligation: 2000000.00,
      current_expenditure: 0.00
    },
    {
      project_code: "075",
      award_type: "transfers",
      award_number: "3675313",
      reporting_period_id: 1,
      current_obligation: 100000.00,
      current_expenditure: 0.00
    }
  ]);
};
