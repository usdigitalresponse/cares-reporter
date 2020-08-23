
exports.up = function(knex) {
  return knex.schema.table('uploads', function (table) {
    table.integer('configuration_id').references('id').inTable('configurations');
  })
};

exports.down = function(knex) {
  return knex.schema.table('uploads', function (table) {
    table.dropColumn('configuration_id')
  })
};
