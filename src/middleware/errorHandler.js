const env = require("../config/env");

function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// Mongoose throws its own error shapes. Translate the ones a client can act on
// into the same { status, message, errors } contract ApiError uses, so the
// frontend keeps getting field-level messages it can drop onto inputs.
function translateMongoError(error) {
  if (error.name === "ValidationError" && error.errors) {
    const details = {};
    for (const [path, issue] of Object.entries(error.errors)) {
      details[path] = issue.message;
    }
    return { status: 400, message: "Please correct the highlighted fields.", details };
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0];
    return {
      status: 409,
      message: field ? `That ${field} is already in use.` : "That record already exists.",
    };
  }

  if (error.name === "CastError") {
    return { status: 400, message: `Invalid value for "${error.path}".` };
  }

  return null;
}

// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity.
function errorHandler(error, _req, res, _next) {
  const translated = error.status ? null : translateMongoError(error);
  const status = translated?.status || error.status || 500;
  const details = translated?.details || error.details;

  if (status >= 500) {
    console.error("[error]", error);
  }

  res.status(status).json({
    success: false,
    message:
      status >= 500 && env.nodeEnv === "production"
        ? "Something went wrong. Please try again."
        : translated?.message || error.message,
    ...(details ? { errors: details } : {}),
  });
}

module.exports = { notFound, errorHandler };
