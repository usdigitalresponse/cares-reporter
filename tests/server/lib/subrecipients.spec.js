/*
--------------------------------------------------------------------------------
-                  tests/server/lib/subrecipients.spec.js
--------------------------------------------------------------------------------

Tests:
1. Upload a spreadsheet with a subrecipient
  - verify that the subrecipient appears in the subrecipients db table
  - verify that the subrecipient doesn't appear in the documents db table
2. Upload a spreadsheet with a change to the subrecipient.
  - verify that there is no change in the subrecipients table (changes to
  existing subrecipients are ignored in agency uploads)
3. POST an edit to the subrecipient to the subrecipient API
  - verify that the change appears in the subrecipients table
4. Close the period
5. POST an edit to the subrecipient to the subrecipient API
  - verify that it returns an error
  - verify that the change does not appear in the subrecipients db table
*/
/* eslint no-unused-expressions: "off" */

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const _ = require('lodash')

const expect = require('chai').expect

const projectRoot = process.cwd()
const knex = require(path.resolve(projectRoot, 'src/server/db/connection'))
const treasury =
  require(path.resolve(projectRoot, 'src/server/lib/treasury'))

const reportingPeriods =
  require(path.resolve(projectRoot, 'src/server/db/reporting-periods'))

const {
  setCurrentReportingPeriod
} = requireSrc(path.resolve(__dirname, '../db/settings'))

const { processUpload } =
  require(path.resolve(projectRoot, 'src/server/services/process-upload'))

const { makeUploadArgs } = require('../services/helpers')

const dirFixtures = path.resolve(__dirname, '../fixtures')

const subrecipientsAPI = createMockRouter(
  requireSrc(path.resolve(__dirname, '../routes/subrecipients'))
)
const { setupAgencies, deleteTreasuryReports } = require('../fixtures/add-dummy-data')

let recordID = 13

describe('Testing lib/subrecipients', () => {
  it('Reset the database', async function () {
    this.timeout(4000)
    await knex.destroy()
    const a = execFileSync('./tests/server/reset-dbx.sh')
    console.log(String.fromCharCode.apply(null, a))
    deleteTreasuryReports()
    await knex.initialize()
    await setupAgencies(knex)

    // When we run this test file as part of "yarn test:server",
    // the current reporting period is set to 2 at this point!
    // How can this be? We destroyed and reseeded the database, and the
    // seed sets it to 1.
    await setCurrentReportingPeriod(1)
  })
  it('Upload a new subrecipient', async () => {
    const uploadArgs = makeUploadArgs(
      path.resolve(
        dirFixtures,
        'data-subrecipients',
        'EOHHS-075-09302020-new_subrecipient-v1.xlsx'
      )
    )
    const result = await processUpload(uploadArgs)
    expect(
      result.valog.getLog(),
      JSON.stringify(result.valog.getLog(), null, 2)
    ).to.be.empty
  })
  it('Subrecipients appear in subrecipients table, not documents', async () => {
    const legalName = 'Test Sub Legal Name'
    let qResult = await knex.raw(`
        select id, legal_name from subrecipients where legal_name='${legalName}'
      ;`)
    if (!qResult.rows[0]) {
      throw new Error(`No records found for legal name: ${legalName}`)
    }
    expect(qResult.rows[0].legal_name).to.equal(legalName)
    recordID = Number(qResult.rows[0].id)
    qResult = await knex.raw(`
        select count(*) from documents where type='subrecipient'
      ;`)
    expect(qResult.rows[0].count).to.equal('0')
  })
  it('Upload a spreadsheet with a changed subrecipient', async () => {
    const uploadArgs = makeUploadArgs(
      path.resolve(
        dirFixtures,
        'data-subrecipients',
        'EOHHS-075-09302020-new_subrecipient-v2.xlsx'
      )
    )
    const result = await processUpload(uploadArgs)
    expect(
      result.valog.getLog(),
      JSON.stringify(result.valog.getLog(), null, 2)
    ).to.be.empty
  })
  it('Subrecipient record should not have changed', async () => {
    const qResult = await knex.raw(`
        select legal_name from subrecipients where legal_name='Test Sub Legal Name'
      ;`)
    expect(qResult.rows[0].legal_name).to.equal('Test Sub Legal Name')
  })
  it('Make a change to a subrecipient via the API', async () => {
    const response = await subrecipientsAPI.put({
      params: { id: recordID },
      body: {
        'identification number': 'TEST-SUB',
        'duns number': '',
        'legal name': 'Test Sub Legal Name - edited',
        'address line 1': 'Test Sub Address Line 1',
        'address line 2': 'Test Sub Address Line 2',
        'address line 3': 'Test Sub Address Line 3',
        'city name': 'Test Sub City Name',
        'state code': 'CA',
        zip: '12345',
        'country name': 'United States',
        'organization type': 'Public/Indian Housing Authority'
      }
    })
    expect(response.statusText).to.equal('OK')
    const qResult = await knex.raw(`
        select legal_name from subrecipients where identification_number='TEST-SUB'
      ;`)
    expect(qResult.rows[0].legal_name).to.equal('Test Sub Legal Name - edited')
  })

  it('Generate a Treasury Report Workbook for period 1', async () => {
    const period = 1
    const treasuryReport = await treasury.generateReport(period)
    if (_.isError(treasuryReport)) {
      throw treasuryReport
    }

    const treasuryReportName =
      path.resolve(
        __dirname,
        '../mocha_uploads/treasury/',
        treasuryReport.filename
      )

    // throws if file missing
    fs.accessSync(treasuryReportName, fs.constants.R_OK)
  })
  it('Close period 1', async function () {
    this.timeout(3000)
    const period = 1

    // throws if error
    await reportingPeriods.close('walter@dahlberg.com', period)

    if (!(await reportingPeriods.isClosed(1))) {
      throw new Error(`Period ${period} should be closed`)
    }
  })
  it('Make a change to an unreported subrecipient via the API', async () => {
    const response = await subrecipientsAPI.put({
      params: { id: recordID },
      body: {
        'identification number': 'TEST-SUB',
        'duns number': '',
        'legal name': 'Test Sub Legal Name - edited again',
        'address line 1': 'Test Sub Address Line 1',
        'address line 2': 'Test Sub Address Line 2',
        'address line 3': 'Test Sub Address Line 3',
        'city name': 'Test Sub City Name',
        'state code': 'CA',
        zip: '12345',
        'country name': 'United States',
        'organization type': 'Public/Indian Housing Authority'
      }
    })
    expect(response.statusText).to.equal('OK')
    const qResult = await knex.raw(`
        select legal_name from subrecipients where identification_number='TEST-SUB'
      ;`)
    expect(qResult.rows[0].legal_name).to.equal('Test Sub Legal Name - edited again')
  })
  it('Fail to make a change to a reported subrecipient via the API', async () => {
    let qResult = await knex.raw(`
        select * from subrecipients where identification_number='5143'
      ;`)
    const objRecord = qResult.rows[0]
    if (!objRecord) {
      throw new Error(qResult)
    }
    expect(objRecord.legal_name).to.equal('UNIVERSITY OF RHODE ISLAND')
    objRecord.legal_name = 'UNIVERSITY OF RHODE ISLAND - edited'
    const recordID = Number(objRecord.id)
    const response = await subrecipientsAPI.put({
      params: { id: recordID },
      body: objRecord
    })
    expect(response.statusText).to.equal(
      `Subrecipient ${recordID} not editable`
    )
    qResult = await knex.raw(`
        select legal_name from subrecipients where identification_number='5143'
      ;`)
    expect(qResult.rows[0].legal_name).to.equal('UNIVERSITY OF RHODE ISLAND')
  })
})

function createMockRouter (routeFile) {
  const handlers = {}
  routeFile.stack.forEach(route => {
    // route.route.stack[0] checks for permissions
    const stack = route.route.stack[1]
    handlers[stack.name] = stack.handle
  })

  function createResponse (cb) {
    const response = Object.create({}, {
      response: {
        value: {
          status: 200,
          statusText: 'OK',
          headers: '',
          body: ''
        }
      }
    })
    Object.defineProperties(response, {
      status: {
        value: function status (code) {
          response.response.status = code
          return response
        }
      },
      json: {
        value: function json (arg) {
          response.response.body = arg
          return cb(response.response)
        }
      },
      send: {
        value: function send (arg) {
          if (response.response.status === 200) {
            response.response.body = arg
          } else {
            response.response.statusText = arg
          }
          return cb(response.response)
        }
      },
      next: {
        value: function next (arg) {
          return cb(arg)
        }
      }
    })
    return response
  }

  const api = Object.create({}, {
    get: {
      value: function get (...args) {
        return new Promise((resolve, reject) => {
          return handlers.get(...args)
        })
      }
    },
    post: {
      value: function post () {
        return new Promise((resolve, reject) => {
          // not implemented
        })
      }
    },
    put: {
      value: function put (req) {
        return new Promise((resolve, reject) => {
          const res = createResponse(resolve)
          handlers.put(req, res, res.next)
        })
      }
    }
  })
  return api
}
