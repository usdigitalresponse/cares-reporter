const sg = require("@sendgrid/mail");

sg.setApiKey(process.env.SENDGRID_API_KEY);
const fromEmail = process.env.SENDGRID_EMAIL;
const expiryMinutes = 30;

function sendPasscode(email, passcode, httpOrigin) {
  const msg = {
    to: email,
    from: fromEmail,
    subject: "CARES Reporter Access Link",
    html: `<p>Your link to access the CARES Reporter is
     <a href="${httpOrigin}/api/sessions?passcode=${passcode}">${httpOrigin}/api/sessions/?passcode=${passcode}</a>.
     It expires in ${expiryMinutes} minutes</p>`
  };
  return sg.send(msg);
}

function sendWelcomeEmail(email, httpOrigin) {
  const msg = {
    to: email,
    from: fromEmail,
    subject: "CARES Reporter Access Granted",
    html: `<p>You have been granted access to the CARES Reporter:
     <a href="${httpOrigin}}">${httpOrigin}</a>.`
  };
  return sg.send(msg);
}

module.exports = { sendPasscode, sendWelcomeEmail };
