const ApiError = require("./ApiError");

const DEFAULT_LIMIT = 20;
const MAX_DASHBOARD_LIMIT = 50;

// HTTP query validation belongs at the API boundary. The model has its own
// defensive bound for direct callers, while HTTP clients receive a clear 400
// instead of silently getting a different result set.
function parseDashboardLimit(value) {
  if (value === undefined) return DEFAULT_LIMIT;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    throw ApiError.badRequest("limit must be an integer between 1 and 50");
  }

  const limit = Number(value);
  if (!Number.isSafeInteger(limit) || limit > MAX_DASHBOARD_LIMIT) {
    throw ApiError.badRequest("limit must be an integer between 1 and 50");
  }

  return limit;
}

module.exports = { DEFAULT_LIMIT, MAX_DASHBOARD_LIMIT, parseDashboardLimit };
