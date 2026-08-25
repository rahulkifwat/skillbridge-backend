const contactModel = require("../models/contactModel");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// A single address may send at most this many messages per window. The form is
// public, so without this a script could fill the table in seconds.
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length) return forwarded.split(",")[0].trim();
  return req.ip || null;
}

const submit = asyncHandler(async (req, res) => {
  const { name, email, organization, inquiryType, subject, message, locale } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  const ipAddress = clientIp(req);

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const recent = await contactModel.countRecent({ email: normalizedEmail, ipAddress, since });
  if (recent >= RATE_LIMIT_MAX) {
    throw new ApiError(429, "Too many messages sent recently. Please try again later.");
  }

  const created = await contactModel.create({
    name: name.trim(),
    email: normalizedEmail,
    organization: organization ? organization.trim() : null,
    inquiryType: inquiryType || "other",
    subject: subject.trim(),
    message: message.trim(),
    locale: locale || "en",
    ipAddress,
    userAgent: (req.headers["user-agent"] || "").slice(0, 255) || null,
  });

  res.status(201).json({
    success: true,
    message: "Thank you — your message has been received.",
    data: { id: created.id },
  });
});

// Admin-only inbox for the messages the public form collects.
const list = asyncHandler(async (req, res) => {
  const { status, limit, offset } = req.query;
  const rows = await contactModel.list({
    status: ["new", "read", "archived"].includes(status) ? status : null,
    limit: Math.min(Number(limit) || 50, 200),
    offset: Number(offset) || 0,
  });

  res.json({ success: true, data: rows.map(contactModel.toPublic) });
});

module.exports = { submit, list };
