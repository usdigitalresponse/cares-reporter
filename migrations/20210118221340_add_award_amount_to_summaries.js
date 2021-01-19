
exports.up = function (knex) {

}

exports.down = function (knex) {

}

exports.up = function (knex) {
  return knex.schema
    .table('period_summaries', function (table) {
      table.text('award_amount')
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('period_summaries', function (table) {
      table.dropColumn('award_amount')
    })
}
