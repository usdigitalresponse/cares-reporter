
exports.up = function (knex) {

}

exports.down = function (knex) {

}

exports.up = function (knex) {
  return knex.schema
    .table('period_summaries', function (table) {
      table.decimal('award_amount', 19, 2)
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('period_summaries', function (table) {
      table.dropColumn('award_amount')
    })
}
