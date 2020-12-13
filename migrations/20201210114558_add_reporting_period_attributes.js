
exports.up = function(knex) {
  return knex.schema
    .table("reporting_periods", function(table) {
      table.date("open_date");
      table.date("close_date");
      table.date("review_period_start_date");
      table.date("review_period_end_date");

    });

};

exports.down = function(knex) {
  return knex.schema
    .table("reporting_periods", function(table) {
      table.dropColumn("open_date");
      table.dropColumn("close_date");
      table.dropColumn("review_period_start_date");
      table.dropColumn("review_period_end_date");
    });

};
