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
