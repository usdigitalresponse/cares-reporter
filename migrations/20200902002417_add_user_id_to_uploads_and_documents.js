
exports.up = function(knex) {
  return knex.schema
    .table('uploads', function(table) {
      table.integer('user_id').unsigned()
      table.foreign('user_id').references('users.id')
    })
    .table('documents', function(table) {
      table.integer('user_id').unsigned()
      table.foreign('user_id').references('users.id')
      table.dropColumn('created_by')
    })
};

exports.down = function(knex) {
  return knex.schema
    .table('uploads', function(table) {
      table.dropColumn('user_id')
    })
    .table('documents', function(table) {
      table.dropColumn('user_id')
      table.text('created_by')
    })
};
