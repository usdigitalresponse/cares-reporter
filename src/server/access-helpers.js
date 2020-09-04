const { userAndRole } = require("./db");

function requireUser(req, res, next) {
  if (!req.signedCookies.userId) {
    res.sendStatus(403);
    res.end();
  } else {
    next();
  }
}

function requireAdminUser(req, res, next) {
  if (!req.signedCookies.userId) {
    res.sendStatus(403);
    res.end();
  } else {
    userAndRole(req.signedCookies.userId).then(user => {
      console.log("user:", user);
      if (user.role !== "admin") {
        res.sendStatus(403);
        res.end();
      } else {
        next();
      }
    });
  }
}

module.exports = { requireAdminUser, requireUser };
