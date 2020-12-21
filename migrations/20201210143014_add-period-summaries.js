
exports.up = function(knex) {
  return knex.schema
  .createTable("period_summaries", function(table) {
    table.increments("id").primary();
    table.text("period").notNullable();
    table.text("project").notNullable();
    table.text("type").notNullable();
    table.decimal("cumulative_obligation", 19, 2).notNullable();
    table.decimal("cumulative_expenditure", 19, 2).notNullable();
  });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable("period_summaries");
};
