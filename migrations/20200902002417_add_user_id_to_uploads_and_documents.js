
exports.up = function(knex) {
  return knex.schema
    .table('uploads', function(table) {
      table.integer('user_id').unsigned()
      table.foreign('user_id').references('users.id')
    })
    .table('documents', function(table) {
      table.integer('user_id').unsigned()
      table.foreign('user_id').references('users.id')
      table.integer('agency_id').unsigned()
      table.foreign('agency_id').references('agencies.id')
    })
};

exports.down = function(knex) {
  return knex.schema
    .table('uploads', function(table) {
      table.dropColumn('user_id')
    })
    .table('documents', function(table) {
      table.dropColumn('user_id')
      table.dropColumn('agency_id')
    })
};
