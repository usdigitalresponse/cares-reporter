/*
--------------------------------------------------------------------------------
-                      tests/db/initialize-db.spec.js
--------------------------------------------------------------------------------

*/
const { execFileSync } = require('child_process')

describe('Initialize the period 2 database', () => {
  it('Initalize the period 2 database', async function () {
    this.timeout(5000)
    let dbname = 'rptest2'
    process.env.POSTGRES_URL = `postgres://localhost/${dbname}`
    execFileSync('./tests/server-periods/reset-db.sh', [dbname], {stdio: 'inherit'})
  })
})
