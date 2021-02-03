/*
--------------------------------------------------------------------------------
-                           routes/ts.js
--------------------------------------------------------------------------------
*/
/* eslint camelcase: 0 */
const router = require('./subrecipients')
const routes = {}
router.stack.forEach(route => {
  // stack[0] checks for permissions
  const stack = route.route.stack[1]
  routes[stack.name] = stack.handle
})

console.dir(routes)
const response = {}
const res = {}
res.json = function json (arg) { res.send(arg); return arg }
res.status = function status (code) { response.status = code; return res }
res.send = function send (msg) { response.message = msg; return msg }
function next (arg) { console.dir(arg); console.log('next') }

routes.get({}, res, next)
// routes.post({
// identification_number,
//     duns_number,
//     legal_name,
//     address_line_1,
//     address_line_2,
//     address_line_3,
//     city_name,
//     state_code,
//     zip,
//     country_name,
//     organization_type
// }, res)
