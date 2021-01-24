/* eslint camelcase: 0 */

/*
--------------------------------------------------------------------------------
-                           db/audit-report.js
--------------------------------------------------------------------------------

*/
const knex = require('./connection')

const _ = require('lodash')

let log = () => {}
if (process.env.VERBOSE) {
  log = console.log
}

module.exports = {
  getAggregateAwardData,
  getAggregatePaymentData,
  getProjectSummaryData,
  getAwardData
}

async function getAwardData (type) {
  const q = {
    contracts: {
      number: 'contract number',
      amount: 'contract amount',
      obligation: 'current quarter obligation',
      expenditure: 'total expenditure amount'
    },

    grants: {
      number: 'award number',
      amount: 'award amount',
      obligation: 'current quarter obligation',
      expenditure: 'total expenditure amount'
    },

    loans: {
      number: 'loan number',
      amount: 'loan amount',
      obligation: 'current quarter obligation',
      expenditure: 'payment amount'
    },

    transfers: {
      number: 'transfer number',
      amount: 'award amount',
      obligation: 'current quarter obligation',
      expenditure: 'total expenditure amount'
    },

    direct: {
      number: 'obligation date',
      amount: 'obligation amount',
      obligation: 'current quarter obligation',
      expenditure: 'total expenditure amount'
    }
  }[type]

  const query = `
    select
      a.code as agency,
      p.code as project,
      d.content->>'subrecipient id' as subrecipient_id,
      d.content->>'${q.number}' as award_number,
      u.reporting_period_id,
      d.type,
      r.legal_name,
      d.content->>'${q.amount}' as award_amount,
      d.content->>'${q.obligation}' as current_obligation,
      d.content->>'${q.expenditure}' as current_expenditure

    from documents as d
    left join uploads as u on d.upload_id = u.id
    left join projects as p on p.id = u.project_id
    left join agencies as a on a.id = u.agency_id
    left join subrecipients as r on
      r.identification_number = d.content->>'subrecipient id'
    where d.type='${type}'
    order by
      a.code,
      p.code,
      d.content->>'subrecipient id',
      d.content->>'${q.number}',
      u.reporting_period_id
    ;`
  // log(query)
  try {
    return knex.raw(query)
  } catch (err) {
    return err
  }
}

async function getAggregateAwardData () {
  try {
    return knex.raw(`
      select
        a.code as Agency,
        p.code as Project,
        u.reporting_period_id,
        d.content->>'funding type' as funding_type,
        d.content->>'current quarter obligation' as obligation,
        d.content->>'current quarter expenditure/payments' as expenditure
      from documents as d
      left join uploads as u on d.upload_id = u.id
      left join projects as p on p.id = u.project_id
      left join agencies as a on a.id = u.agency_id
      where d.type='aggregate awards < 50000'
      order by
        a.code,
        p.code,
        d.content->>'funding type'
      ;`
    )
  } catch (err) {
    return err
  }
}

async function getAggregatePaymentData () {
  try {
    return knex.raw(`
      select
        a.code as Agency,
        p.code as Project,
        u.reporting_period_id,
        d.content->>'current quarter obligation' as obligation,
        d.content->>'current quarter expenditure' as expenditure
      from documents as d
      left join uploads as u on d.upload_id = u.id
      left join projects as p on p.id = u.project_id
      left join agencies as a on a.id = u.agency_id
      where d.type='aggregate payments individual'
      order by
        p.code
      ;`
    )
  } catch (err) {
    return err
  }
}

async function getProjectSummaryData () {
  try {
    return knex.raw(`
      select
        a.code as Agency,
        p.code as Project,
        p.name as name,
        p.status as status,
        u.reporting_period_id,
        d.content->>'current quarter obligation' as obligation,
        d.content->>'current quarter expenditure/payments' as expenditure
      from documents as d
      left join uploads as u on d.upload_id = u.id
      left join projects as p on p.id = u.project_id
      left join agencies as a on a.id = u.agency_id
      order by
        a.code,
        p.code
      ;`
    )
  } catch (err) {
    return err
  }
}

/*                                 *  *  *                                    */
