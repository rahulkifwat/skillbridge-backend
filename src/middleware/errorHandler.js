const env = require("../config/env");

function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity.
function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;

  if (status >= 500) {
    console.error("[error]", error);
  }

  res.status(status).json({
    success: false,
    message:
      status >= 500 && env.nodeEnv === "production"
        ? "Something went wrong. Please try again."
        : error.message,
    ...(error.details ? { errors: error.details } : {}),
  });
}

module.exports = { notFound, errorHandler };
