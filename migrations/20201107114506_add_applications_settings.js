
exports.up = function(knex) {
  return knex.schema
    .table('application_settings', function(table) {
      table.text('duns_number')
    })
};

exports.down = function(knex) {
  return knex.schema
    .table('application_settings', function(table) {
      table.dropColumn('duns_number');
    })
};
