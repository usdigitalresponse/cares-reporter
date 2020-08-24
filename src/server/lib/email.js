const sg = require("@sendgrid/mail");

sg.setApiKey(process.env.SENDGRID_API_KEY);
const siteUrl = process.env.SITE_URL;
const fromEmail = process.env.SENDGRID_EMAIL;
const expiryMinutes = 30;

function sendPasscode(email, passcode) {
  const msg = {
    to: email,
    from: fromEmail,
    subject: "Cares Reporter Access Link",
    html: `<p>Your link to access the grant reporter is
     <a href="${siteUrl}/api/sessions?passcode=${passcode}">${siteUrl}/api/sessions/?passcode=${passcode}</a>.
     It expires in ${expiryMinutes} minutes</p>`
  };
  return sg.send(msg);
}

module.exports = { sendPasscode };
