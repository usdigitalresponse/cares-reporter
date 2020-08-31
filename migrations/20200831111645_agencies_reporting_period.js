
exports.up = function(knex) {
  return knex.schema
    .createTable('reporting_periods', function(table) {
      table.increments('id').primary()
      table.text('name').notNullable().unique()
      table.date('start_date').notNullable()
      table.date('end_date').notNullable()
    })
    .table('uploads', function(table) {
      table.integer('reporting_period_id').unsigned()
      table.foreign('reporting_period_id').references('reporting_periods.id')
    })
    .createTable('agencies', function(table) {
      table.increments('id').primary()
      table.text('name').notNullable().unique()
    })
    .table('users', function(table) {
      table.integer('agency_id').unsigned()
      table.foreign('agency_id').references('agencies.id')
    })
};

exports.down = function(knex) {
  return knex.schema
    .table('users', function(table) {
      table.dropColumn('agency_id')
    })
    .dropTable('agencies')
    .table('uploads', function(table) {
      table.dropColumn('reporting_period_id')
    })
    .dropTable('reporting_periods')
};
