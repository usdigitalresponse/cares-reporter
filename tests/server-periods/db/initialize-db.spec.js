/*
--------------------------------------------------------------------------------
-                      tests/db/initialize-db.spec.js
--------------------------------------------------------------------------------

*/
const fs = require('fs')
const path = require('path')
const { getPeriodSummaries, readSummaries } =
  requireSrc(`${__dirname}/../../server/db`)
const treasury = requireSrc(`${__dirname}/../../server/lib/treasury`)
const _ = require('lodash')

const reportingPeriods =
  requireSrc(`${__dirname}/../../server/db/reporting-periods`)

const expect = require('chai').expect
const knex = requireSrc(`${__dirname}/../../server/db/connection`)
const { execFileSync } = require('child_process')

describe('Initialize the period 2 database', () => {
  it('Initalize the period 2 database', async () => {
    execFileSync('reset-db.sh')
  })
})
