function authMiddleware(req, res, next) {
  // Por enquanto só deixa passar
  next();
}

module.exports = authMiddleware;