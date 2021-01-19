/* eslint camelcase: 0 */

/*
--------------------------------------------------------------------------------
-                           lib/summary-report.js
--------------------------------------------------------------------------------
  Summary Report spec

  Contracts Tab
    1.  Agency Code (alpha code from Cover tab column A)
    2.  Project ID
    3.  Subrecipient Legal Name
    4.  Contract Number[SLE(1]
    Columns 5, 6, 7 should repeat for each period
      5.  Contract Amount (column F), each period[SLE(2]
        a.  Formula: current period Contract Amount – prior period Contract
            Amount = Current Quarter Obligation.  If not equal, need error
            message.
      6.  Current Quarter Obligation (column R), each period –
        a.  Formula: Cumulative Obligation Amount = sum of the quarterly
            obligation amounts
        b.  Formula: Cumulative Obligation Amount = current period Contract
            Amount.  If not equal, need error message.
      7.  Total Expenditure Amount (column U), each period
        a.  Formula: Cumulative Expenditure [SLE(3] Amount = sum of the
            quarterly expenditure amounts
        b.  Formula: Cumulative Expenditure Amount ≤ Cumulative Obligation
            Amount.  If not, need error message.

  Grants Tab
    1.  Agency Code
    2.  Project ID
    3.  Subrecipient Legal Name
    4.  Award Number
    5.  Award Amount (column F), each period
      a.  Same as contracts
    6.  Current Quarter Obligation (column T), each period
      a. Same as contracts
    7.  Total Expenditure Amount (column W), each period
      a.  Same as contracts

  Loans Tab
    1.  Agency Code
    2.  Project ID
    3.  Subrecipient Legal Name
    4.  Loan Number
    5.  Loan Amount (column E), each period
      a.  Formula: current period Loan Amount – prior period Loan Amount =
          Current Quarter Obligation.  If not equal, need error message.
    6.  Current Quarter Obligation (column P), each period
      a.  Formula: Cumulative Obligation Amount
      b.  Formula: Cumulative Obligation Amount = current period Loan
          Amount.  If not equal, need error message.

  Transfers Tab
    1.  Agency Code
    2.  Project ID
    3.  Subrecipient Legal Name
    4.  Transfer Number
    5.  Transfer Amount (column E), each period
      a.  Same as grants
    6.  Current Quarter Obligation (column I), each period
      a.  Same as grants
    7.  Total Expenditure Amount (column L), each period
      a.  Same as grants

  Direct Tab
    1.  Agency Code
    2.  Project ID
    3.  Subrecipient Legal Name
    4.  Award date
    5.  Obligation Amount (column B), each period
      a.  Same as grants.
    6.  Current Quarter Obligation (column E), each period
      a.  Same as grants
    7.  Total Expenditure Amount (column I), each period
      a.  Same as grants

  Aggregate Awards < 50000
    1.  Agency Code
    2.  Project ID
    3.  Funding Type[SLE(4]  (one row per funding type, per project)
    4.  Current Quarter Obligation (column C), each period
    a.  Formula: Cumulative Obligation Amount
    5.  Current Quarter Expenditure/Payments (column D), each period
      a.  Formula: Cumulative Expenditure Amount
      b.  Formula: Cumulative Expenditure Amount ≤ Cumulative Obligation
          Amount.  If not, need error message.

  Aggregate Payments Individual
    1.  Agency Code
    2.  Project ID[SLE(5]
    3.  Current Quarter Obligation (column B), each period
      a.  Formula: Cumulative Obligation Amount
    4.  Current Quarter Expenditure (column C), each period
      a.  Formula: Cumulative Expenditure Amount

*/
const { getPeriodSummaries } = require('../db/period-summaries')
const {
  getCurrentReportingPeriodID
} = require('../db/settings')

const knex = require('../db/connection')

let log = () => {}
if (process.env.VERBOSE) {
  log = console.log
}

module.exports = { generate: generateReport }

/*  generateReport generates a fresh Summary Report spreadsheet
    and writes it out if successful.
    */
async function generateReport () {
  log('generateReport ()')
  const currentReportingPeriod = getCurrentReportingPeriodID()
  const nPeriods = currentReportingPeriod + 1

  const outputSheetNames = [
    'Contracts',
    'Grants',
    'Loans',
    'Transfers',
    'Direct',
    'Aggregate Awards < 50000',
    'Aggregate Payments Individual'
  ]

  const query = `select
      s.reporting_period_id,
      s.award_type,
      a.code as Agency,
      s.project_code as Project,
      s.subrecipient_identification_number,
      r.legal_name,
      s.award_number,
      s.current_obligation,
      s.current_expenditure
    from period_summaries as s
    left join projects as p on p.code = s.project_code
    left join agencies as a on a.id = p.agency_id
    left join subrecipients as r on
      r.identification_number = s.subrecipient_identification_number
    order by subrecipient_identification_number`

  const result = await knex.raw(query)

  const sheetsOut = {}

  const periodSummaries = []
  for (let i = 0; i < nPeriods; i++) {
    periodSummaries[i] = await getPeriodSummaries(i + 1)
    /*
      returns an object:
      { periodSummaries: [],
        errors:[]
      }

      Each element in the periodSummaries array looks like this:

      { id: 3,
        reporting_period_id: 1,
        project_code: '042505',
        award_type: 'direct',
        award_number: '8-21591:44089',
        current_obligation: '55159.63',
        current_expenditure: '55159.63',
        subrecipient_identification_number: '8-21591'
      }
      the errors look like this:
        'Multiple current quarter obligations for 490629:grants:AGEFHVAC - 150000'
        where
          490629 is the project_code,
          grants is the award_type,
          AGEFHVAC is the award_number

      would like:
        agency code
          find project record from project_code
            find agency_id in project record
              find agency record from agency_id
              find agency.code in agency record
        subrecipient legal name
          find subrecipient record from subrecipient_identification_number
            find subrecipient.legal_name in subrecipient record
        amount

        Should put agency code and amount in summary records.

        select
          s.reporting_period_id,
          s.award_type,
          a.code as Agency,
          s.project_code as Project,
          s.subrecipient_identification_number,
          r.legal_name,
          s.award_number,
          s.current_obligation,
          s.current_expenditure
        from period_summaries as s
        left join projects as p on p.code = s.project_code
        left join agencies as a on a.id = p.agency_id
        left join subrecipients as r on
          r.identification_number = s.subrecipient_identification_number
        order by subrecipient_identification_number
        ;

      */
  }
  sheetsOut.Contracts = getContractsSheet(periodSummaries)
}

function getContractsSheet (periodSummaries) {
  console.dir(periodSummaries[0].periodSummaries[0])
  console.dir(periodSummaries[0].errors)
}

/*                                  *  *  *                                   */
