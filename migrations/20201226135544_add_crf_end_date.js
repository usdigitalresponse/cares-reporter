
exports.up = function(knex) {
  return knex.schema
    .table("reporting_periods", function(table) {
      table.date("crf_end_date");
    });
  
};

exports.down = function(knex) {
  return knex.schema
    .table("reporting_periods", function(table) {
      table.dropColumn("crf_end_date");
    });
  
};
