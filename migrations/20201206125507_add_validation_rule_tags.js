
exports.up = function(knex) {
  return knex.schema
    .table('application_settings', function(table) {
      table.specificType('validation_rule_tags', 'TEXT[]')
    })
};

exports.down = function(knex) {
  return knex.schema
    .table('application_settings', function(table) {
      table.dropColumn('validation_rule_tags');
    })
};
