const jwt = require("jsonwebtoken");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const userModel = require("../models/userModel");

function readToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  if (req.cookies && req.cookies.sb_token) return req.cookies.sb_token;
  return null;
}

// Rejects the request unless a valid token maps to an active user.
async function requireAuth(req, _res, next) {
  try {
    const token = readToken(req);
    if (!token) throw ApiError.unauthorized("Missing authentication token");

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      throw ApiError.unauthorized("Session expired or token is invalid");
    }

    const user = await userModel.findById(payload.sub);
    if (!user || !user.is_active) {
      throw ApiError.unauthorized("Account no longer active");
    }

    req.user = userModel.toPublic(user);
    next();
  } catch (error) {
    next(error);
  }
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };
}

// Convenience guard for routes that are restricted to one dashboard area.
// Keep the authorization decision on the API: client-side route guards are
// only a UX aid and must never be the enforcement layer.
function requireDashboardRole(role) {
  return requireRole(role);
}

module.exports = { requireAuth, requireRole, requireDashboardRole };
