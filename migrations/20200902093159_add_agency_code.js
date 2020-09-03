
exports.up = function(knex) {
  return knex.schema
    .table('agencies', function (table) {
      table.text('code').unique()
    })
};

exports.down = function(knex) {
  return knex.schema
    .table('agencies', function (table) {
      table.dropColumn('code')
    })
};
