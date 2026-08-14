const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

// Turns express-validator output into a { field: message } map the login form
// can drop straight onto its inputs.
module.exports = function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = {};
  for (const error of result.array()) {
    if (!details[error.path]) details[error.path] = error.msg;
  }

  next(ApiError.badRequest("Please correct the highlighted fields.", details));
};
