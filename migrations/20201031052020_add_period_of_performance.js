
exports.up = function(knex) {
  return knex.schema
    .table('reporting_periods', function(table) {
      table.date('period_of_performance_end_date')
    })
};

exports.down = function(knex) {
  return knex.schema
    .table('reporting_periods', function(table) {
      table.dropColumn('period_of_performance_end_date')
    })
};
