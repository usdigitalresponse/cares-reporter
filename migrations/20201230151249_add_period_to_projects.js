
exports.up = function(knex) {
  return knex.schema
    .table("projects", function(table) {
      table.integer("created_in_period");
      table.foreign("created_in_period").references("reporting_periods.id");
    });
};

exports.down = function(knex) {
  return knex.schema
    .table("projects", function(table) {
      table.dropColumn("created_in_period");
    });
};

