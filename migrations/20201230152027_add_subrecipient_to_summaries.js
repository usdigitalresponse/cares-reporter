
exports.up = function(knex) {
  return knex.schema
    .table("period_summaries", function(table) {
      table.text("subrecipient_identification_number");
      table.foreign("subrecipient_identification_number").references("subrecipients.identification_number");
    });
};

exports.down = function(knex) {
  return knex.schema
    .table("period_summaries", function(table) {
      table.dropColumn("subrecipient_identification_number");
    });
};
