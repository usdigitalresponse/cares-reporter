
exports.up = function(knex) {
  return knex.schema
    .table('application_settings', function(table) {
      table.text('reporting_template')
    })
};

exports.down = function(knex) {
  return knex.schema
    .table('application_settings', function(table) {
      table.dropColumn('reporting_template');
    })
};
