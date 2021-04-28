/* eslint no-unused-expressions: "off" */
require('dotenv').config()
const path = require('path')

const email = require(
  path.resolve(__dirname, '../../src/server/lib/email.js')
)

describe('Check that Nodemailer works', () => {
  it('sends a login email', async () => {
    const toAddress = 'caresreportertest+sending@gmail.com'
    const result = await email.sendPasscode(
      toAddress,
      new Date(),
      'httpOrigin'
    )
    // console.dir(result)
    if (result.accepted[0] !== toAddress) {
      throw new Error('Nodemailer failed to send login email')
    }
  })
})
