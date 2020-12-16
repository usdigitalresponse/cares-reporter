
exports.up = function(knex) {
  return knex.schema
  .createTable("period_summaries", function(table) {
    table.increments("id").primary();
    table.integer("reporting_period_id").notNullable();
    table.integer("project_id").notNullable();
    table.text("type").notNullable();
    table.decimal("current_obligation", 19, 2).notNullable();
    table.decimal("current_expenditure", 19, 2).notNullable();
    table.foreign("reporting_period_id").references("reporting_periods.id");
    table.foreign("project_id").references("projects.id");
  });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable("period_summaries");
};
