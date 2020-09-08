
exports.up = function(knex) {
  return knex.schema
    .createTable('projects', function(table) {
      table.increments('id').primary()
      table.text('code').notNullable().unique()
      table.text('name').notNullable().unique()
    })
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('projects')
};
