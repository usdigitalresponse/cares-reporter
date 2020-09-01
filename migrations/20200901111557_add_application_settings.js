
exports.up = function(knex) {
  return knex.schema
    .createTable('application_settings', function (table) {
      table.text('title')
      table.integer('current_reporting_period_id').references('id').inTable('reporting_periods')
    })
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('application_settings')
};
