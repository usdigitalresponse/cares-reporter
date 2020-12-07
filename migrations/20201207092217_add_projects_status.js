
exports.up = function(knex) {
  return knex.schema
    .table('projects', function(table) {
      table.text('status')
    })
  
};

exports.down = function(knex) {
  return knex.schema
    .table('projects', function(table) {
      table.dropColumn('status');
    })
  
};
