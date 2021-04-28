/*
--------------------------------------------------------------------------------
-                                 lib/email-nodemailer.js
--------------------------------------------------------------------------------
  Testing:
    NODEMAILER_HOST=smtp.gmail.com
    NODEMAILER_PORT=465
    NOTIFICATIONS_EMAIL="caresreportertest@gmail.com"
    NOTIFICATIONS_EMAIL_PW="PW for Cares-Reporter-Test!"
*/
/* eslint camelcase: 0 */

const nodemailer = require('nodemailer')
const transport = createTransport()

async function send (message) {
  const params = {
    from: process.env.NOTIFICATIONS_EMAIL, // sender address
    to: message.toAddress, // list of receivers e.g. 'a@aa.com, b@bb.com'
    subject: message.subject,
    // text: 'Hello world?', // plain text body
    html: message.body // html body
  }
  return transport.sendMail(params)
}

/* createTransport() create reusable transporter object using the default
  SMTP transport
  */
function createTransport () {
  if (!process.env.NODEMAILER_HOST) {
    return {
      sendMail: () => {
        throw new Error(
          'Missing Nodemailer info!'
        )
      }
    }
  }
  return nodemailer.createTransport({
    host: process.env.NODEMAILER_HOST, // e.g. 'smtp.ethereal.email'
    port: process.env.NODEMAILER_PORT, // e.g. 465
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.NOTIFICATIONS_EMAIL,
      pass: process.env.NOTIFICATIONS_EMAIL_PW
    }
  })
}

module.exports = { send }

/*                                  *  *  *                                   */
