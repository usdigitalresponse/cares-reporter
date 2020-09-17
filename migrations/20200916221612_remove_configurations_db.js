
exports.up = function(knex) {
  return knex.schema
    .table('uploads', function(table) {
      table.dropColumn('configuration_id');
    })
    .dropTable('configurations')
};

exports.down = function(knex) {
  return knex.schema
   .createTable('configurations', function (table) {
      table.increments('id').primary()
      table.text('type').notNullable()
      table.string('name').notNullable().unique()
      table.integer('sort_order').defaultTo(0)
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
      table.json('content').notNullable()
    })
    .table('uploads', function (table) {
      table.integer('configuration_id').references('id').inTable('configurations');
    })
};
