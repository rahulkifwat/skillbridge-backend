const { ContactMessage } = require("./schemas");

async function create({
  name,
  email,
  organization = null,
  inquiryType = "other",
  subject,
  message,
  locale = "en",
  ipAddress = null,
  userAgent = null,
}) {
  const created = await ContactMessage.create({
    name,
    email,
    organization,
    inquiryType,
    subject,
    message,
    locale,
    ipAddress,
    userAgent,
  });
  // toPublic so callers get a string `id` rather than a raw ObjectId `_id`.
  return toPublic(await findById(created._id));
}

async function findById(id) {
  if (!id) return null;
  const row = await ContactMessage.findById(id).lean().catch(() => null);
  return row || null;
}

async function list({ status = null, limit = 50, offset = 0 } = {}) {
  return ContactMessage.find(status ? { status } : {})
    .sort({ createdAt: -1, _id: -1 })
    .skip(Number(offset) || 0)
    .limit(Number(limit))
    .lean();
}

// How many messages this email/IP pair sent since `since` — the spam guard.
async function countRecent({ email, ipAddress, since }) {
  const identities = [{ email: String(email).trim().toLowerCase() }];
  if (ipAddress) identities.push({ ipAddress });

  return ContactMessage.countDocuments({
    createdAt: { $gte: since },
    $or: identities,
  });
}

// Reshapes to the camelCase the frontend expects.
function toPublic(row) {
  if (!row) return null;
  return {
    id: String(row._id),
    name: row.name,
    email: row.email,
    organization: row.organization,
    inquiryType: row.inquiryType,
    subject: row.subject,
    message: row.message,
    locale: row.locale,
    status: row.status,
    createdAt: row.createdAt,
  };
}

module.exports = { create, findById, list, countRecent, toPublic };
