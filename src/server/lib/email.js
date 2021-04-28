/*
--------------------------------------------------------------------------------
-                                 lib/email.js
--------------------------------------------------------------------------------

*/
/* eslint camelcase: 0 */

const transport = process.env.AWS_ACCESS_KEY_ID
  ? require('./email-aws')
  : require('./email-nodemailer')

function sendPasscode (toAddress, passcode, httpOrigin) {
  const expiryMinutes = parseInt(process.env.LOGIN_EXPIRY_MINUTES) || 30
  return transport.send({
    toAddress: toAddress,
    subject: 'CARES Reporter Access Link', // Subject line
    body: `<p>Your link to access the CARES Reporter is
       <a href="${httpOrigin}/api/sessions?passcode=${passcode}">${httpOrigin}/api/sessions/?passcode=${passcode}</a>.
       It expires in ${expiryMinutes} minutes</p>`
  })
}

function sendWelcomeEmail (toAddress, httpOrigin) {
  return transport.send({
    toAddress: toAddress,
    subject: 'Welcome to CARES Reporter', // Subject line
    body: `<p>You have been granted access to the CARES Reporter:
       <a href="${httpOrigin}">${httpOrigin}</a>.`
  })
}

module.exports = { sendPasscode, sendWelcomeEmail }

/*                                  *  *  *                                   */
