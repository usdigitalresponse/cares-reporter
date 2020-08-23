function requireUser(req, res, next) {
  if (!req.signedCookies.userId) {
    res.sendStatus(403);
    res.end();
  } else {
    next();
  }
}

module.exports = { requireUser };
