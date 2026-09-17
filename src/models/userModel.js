const { User } = require("./schemas");

// Mongo hands back `_id` as an ObjectId. Everything above this layer — JWT
// subjects, API responses, the frontend — works with a plain string `id`.
function normalize(document) {
  if (!document) return null;
  const { _id, __v, ...rest } = document;
  return { id: String(_id), ...rest };
}

async function findByEmail(email) {
  // passwordHash is `select: false` on the schema, so login has to opt in.
  const document = await User.findOne({ email: String(email).trim().toLowerCase() })
    .select("+passwordHash")
    .lean();
  return normalize(document);
}

async function findById(id) {
  if (!id) return null;
  const document = await User.findById(id).lean().catch(() => null);
  return normalize(document);
}

async function create({
  fullName,
  email,
  passwordHash,
  role = "student",
  persona = null,
  academy = "global",
  googleId = null,
  microsoftId = null,
}) {
  const created = await User.create({
    fullName,
    email,
    passwordHash,
    role,
    persona,
    academy: academy === "spanish" ? "spanish" : "global",
    googleId,
    microsoftId,
  });
  return findById(created._id);
}

async function setAcademy(id, academy) {
  if (!id || academy !== "spanish") return;
  try {
    await User.updateOne({ _id: id }, { $set: { academy: "spanish" } });
  } catch {
    // Offline tests still tag the session on the next login/register.
  }
}

async function findByGoogleId(googleId) {
  if (!googleId) return null;
  const document = await User.findOne({ googleId }).lean();
  return normalize(document);
}

async function findByMicrosoftId(microsoftId) {
  if (!microsoftId) return null;
  const document = await User.findOne({ microsoftId }).lean();
  return normalize(document);
}

async function listStudents() {
  try {
    const documents = await User.find({ role: "student", isActive: true }).lean();
    return documents.map(normalize);
  } catch {
    return [];
  }
}

async function touchLastLogin(id) {
  await User.updateOne({ _id: id }, { $set: { lastLoginAt: new Date() } });
}

// Strips passwordHash and returns only the fields the client is allowed to see.
function toPublic(user) {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    persona: user.persona,
    academy: user.academy === "spanish" ? "spanish" : "global",
    avatarUrl: user.avatarUrl,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

module.exports = {
  findByEmail,
  findById,
  findByGoogleId,
  findByMicrosoftId,
  create,
  setAcademy,
  listStudents,
  touchLastLogin,
  toPublic,
  normalize,
};
