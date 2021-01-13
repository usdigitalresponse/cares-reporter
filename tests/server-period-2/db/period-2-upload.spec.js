/*
--------------------------------------------------------------------------------
-                      tests/db/period-2-upload.spec.js
--------------------------------------------------------------------------------
  rptest2 database is from Rhode Island
  In the rptest2 database, period 1 has already been closed.
*/
const path = require('path')

const { makeUploadArgs } = require('./helpers')
const srcDir = path.resolve(process.cwd(), `src/server`)
const { processUpload } = require(path.resolve(srcDir, `services/process-upload`))

const dbname = 'rptest2'
process.env.POSTGRES_URL = `postgres://localhost/${dbname}`
process.env.UPLOAD_DIRECTORY = path.resolve(__dirname, `../mocha_uploads`)
process.env.TREASURY_DIRECTORY = path.resolve(__dirname, `../mocha_uploads/treasury`)

const fixturesDir = path.resolve(__dirname, `../fixtures/`)

describe('Upload a period 2 agency spreadsheet', () => {
  it(`Handles a spreadsheet with bogus non-empty cells`, async function () {
    this.timeout(6000)

    const uploadArgs = makeUploadArgs(
      path.resolve(fixturesDir, `uploads/ri/DLT-190-123120-v2.xlsx`)
    )
    const result = await processUpload(uploadArgs)
    if (result.valog.log.length > 2) {
      console.dir(result.valog.log, {depth: 4})
      throw new Error('Too many validation errors!')
    }
  })
})
