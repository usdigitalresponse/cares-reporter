
exports.up = function(knex) {
  return knex.schema
    .table('uploads', function(table) {
      table.integer('project_id').unsigned()
      table.foreign('project_id').references('projects.id')
    })
};

exports.down = function(knex) {
  return knex.schema
    .table('uploads', function(table) {
      table.dropColumn('project_id')
    })
};
