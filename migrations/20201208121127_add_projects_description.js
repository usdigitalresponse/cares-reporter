
exports.up = function(knex) {
  return knex.schema
    .table("projects", function(table) {
      table.text("description");
    });
};

exports.down = function(knex) {
  return knex.schema
    .table("projects", function(table) {
      table.dropColumn("description");
    });
};
