const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const userModel = require("../models/userModel");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { resolveAcademy } = require("../utils/spanishSplit");
const { signToken, setSessionCookie } = require("./authController");

function configuredProviders() {
  return {
    google: Boolean(env.oauth.googleClientId && env.oauth.googleClientSecret),
    microsoft: Boolean(env.oauth.microsoftClientId && env.oauth.microsoftClientSecret),
    apple: Boolean(env.oauth.appleClientId && env.oauth.appleClientSecret),
  };
}

function callbackUrl(provider) {
  const apiBase = env.apiPublicUrl;
  return `${apiBase.replace(/\/$/, "")}/api/auth/oauth/${provider}/callback`;
}

function signState(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "10m" });
}

function readState(token) {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }
}

function frontendLanding(academy, nextPath) {
  const origin = env.frontendOrigin.replace(/\/$/, "");
  if (typeof nextPath === "string" && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    return `${origin}${nextPath}`;
  }
  return academy === "spanish" ? `${origin}/spanish-academy` : `${origin}/student`;
}

async function upsertOAuthUser({ email, fullName, academy, googleId, microsoftId }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) throw ApiError.badRequest("The identity provider did not return an email address.");

  let user = googleId ? await userModel.findByGoogleId(googleId) : null;
  if (!user && microsoftId) user = await userModel.findByMicrosoftId(microsoftId);
  if (!user) user = await userModel.findByEmail(normalizedEmail);

  if (!user) {
    user = await userModel.create({
      fullName: fullName || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), env.bcryptRounds),
      role: "student",
      academy: resolveAcademy(null, academy),
      googleId: googleId || null,
      microsoftId: microsoftId || null,
    });
    return user;
  }

  const nextAcademy = resolveAcademy(user.academy, academy);
  const patch = {};
  if (nextAcademy === "spanish" && user.academy !== "spanish") patch.academy = "spanish";
  if (googleId && !user.googleId) patch.googleId = googleId;
  if (microsoftId && !user.microsoftId) patch.microsoftId = microsoftId;
  if (Object.keys(patch).length) {
    const { User } = require("../models/schemas");
    await User.updateOne({ _id: user.id }, { $set: patch });
    user = { ...user, ...patch };
  }
  return user;
}

const providers = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: { providers: configuredProviders() } });
});

const start = asyncHandler(async (req, res) => {
  const provider = String(req.params.provider || "");
  const flags = configuredProviders();
  if (!flags[provider]) {
    throw ApiError.badRequest(`${provider} sign-in is not configured on this server.`);
  }

  const academy = resolveAcademy(null, req.query.academy);
  const state = signState({
    academy,
    next: typeof req.query.next === "string" ? req.query.next : "",
    provider,
  });

  if (provider === "google") {
    const params = new URLSearchParams({
      client_id: env.oauth.googleClientId,
      redirect_uri: callbackUrl("google"),
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
    });
    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  }

  if (provider === "microsoft") {
    const params = new URLSearchParams({
      client_id: env.oauth.microsoftClientId,
      redirect_uri: callbackUrl("microsoft"),
      response_type: "code",
      scope: "openid email profile User.Read",
      state,
      response_mode: "query",
    });
    return res.redirect(`https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`);
  }

  throw ApiError.badRequest("Apple sign-in requires additional private-key setup.");
});

async function exchangeGoogle(code) {
  const body = new URLSearchParams({
    code,
    client_id: env.oauth.googleClientId,
    client_secret: env.oauth.googleClientSecret,
    redirect_uri: callbackUrl("google"),
    grant_type: "authorization_code",
  });
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) throw ApiError.unauthorized("Google sign-in did not complete.");
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const profile = await profileRes.json();
  return {
    email: profile.email,
    fullName: profile.name,
    googleId: profile.id,
  };
}

async function exchangeMicrosoft(code) {
  const body = new URLSearchParams({
    code,
    client_id: env.oauth.microsoftClientId,
    client_secret: env.oauth.microsoftClientSecret,
    redirect_uri: callbackUrl("microsoft"),
    grant_type: "authorization_code",
  });
  const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) throw ApiError.unauthorized("Microsoft sign-in did not complete.");
  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const profile = await profileRes.json();
  return {
    email: profile.mail || profile.userPrincipalName,
    fullName: profile.displayName,
    microsoftId: profile.id,
  };
}

const callback = asyncHandler(async (req, res) => {
  const provider = String(req.params.provider || "");
  const state = readState(req.query.state);
  if (!state || state.provider !== provider) throw ApiError.unauthorized("OAuth state is invalid or expired.");
  const code = String(req.query.code || "");
  if (!code) throw ApiError.badRequest("Missing authorization code.");

  const identity = provider === "google" ? await exchangeGoogle(code) : await exchangeMicrosoft(code);
  const user = await upsertOAuthUser({
    ...identity,
    academy: state.academy,
  });
  await userModel.touchLastLogin(user.id);
  const token = signToken(user);
  setSessionCookie(res, token);
  const landing = new URL(frontendLanding(user.academy, state.next));
  landing.searchParams.set("oauth", "1");
  res.redirect(landing.toString());
});

module.exports = { providers, start, callback, configuredProviders };
