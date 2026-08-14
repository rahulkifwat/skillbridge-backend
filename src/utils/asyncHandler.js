// Express 5 forwards rejected promises automatically, but wrapping keeps the
// intent explicit and works the same if the app is ever downgraded to v4.
module.exports = function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
};
