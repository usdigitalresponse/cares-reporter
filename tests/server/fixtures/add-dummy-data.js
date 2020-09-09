const setupAgencies = knex => {
  return knex("agencies").insert([
    { name: "Generic Government", code: "GOV" },
    { name: "Office of Management and Budget", code: "OMB" },
    { name: "Department of Health", code: "DOH" }
  ]);
};

module.exports = {
  setupAgencies
};

// Run this file directly through node to set up dummy data for manual testing.
if (require.main === module) {
  require("dotenv").config();
  const knex = require("../../../src/server/db/connection");
  setupAgencies(knex).then(() => {
    knex.destroy();
  });
}
