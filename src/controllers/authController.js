const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const userModel = require("../models/userModel");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

// Mirrors the token into an httpOnly cookie so server components can read the
// session too; the JSON token stays the primary channel for the client.
function setSessionCookie(res, token) {
  res.cookie("sb_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, role, persona } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  if (await userModel.findByEmail(normalizedEmail)) {
    throw ApiError.conflict("An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
  const created = await userModel.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    passwordHash,
    role,
    persona,
  });

  const token = signToken(created);
  setSessionCookie(res, token);

  res.status(201).json({
    success: true,
    message: "Account created.",
    data: { token, user: userModel.toPublic(created) },
  });
});

const login = asyncHandler(async (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  const { password } = req.body;

  const user = await userModel.findByEmail(email);

  // Same message for unknown email and wrong password — don't leak which
  // addresses are registered.
  const invalid = ApiError.unauthorized("Incorrect email or password.");
  if (!user) throw invalid;
  if (!(await bcrypt.compare(password, user.passwordHash))) throw invalid;
  if (!user.isActive) throw ApiError.forbidden("This account has been deactivated.");

  await userModel.touchLastLogin(user.id);

  const token = signToken(user);
  setSessionCookie(res, token);

  res.json({
    success: true,
    message: "Logged in.",
    data: { token, user: userModel.toPublic(user) },
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

const logout = asyncHandler(async (_req, res) => {
  res.clearCookie("sb_token", { path: "/" });
  res.json({ success: true, message: "Logged out." });
});

module.exports = { register, login, me, logout };
