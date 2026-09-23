/**
 * Mongoose schemas for every collection the API touches.
 *
 * Field names are camelCase here (the MySQL snake_case column names are gone).
 * `timestamps` gives each document createdAt/updatedAt automatically.
 */
const mongoose = require("mongoose");

const { Schema } = mongoose;

const USER_ROLES = [
  "student",
  "instructor",
  "employer",
  "administrator",
  "partner",
  "super_admin",
];

const INQUIRY_TYPES = [
  "student",
  "employer",
  "university",
  "school",
  "government",
  "partner",
  "other",
];

const CONTACT_STATUSES = ["new", "read", "archived"];

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 190,
      unique: true,
    },
    // Never selected by default — findByEmail asks for it explicitly so a
    // stray query can't leak the hash into an API response.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: "student" },
    academy: { type: String, enum: ["spanish", "global"], default: "global", index: true },
    persona: { type: String, default: null, maxlength: 60 },
    avatarUrl: { type: String, default: null },
    googleId: { type: String, default: null, index: true },
    microsoftId: { type: String, default: null, index: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "users" }
);

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, maxlength: 160 },
    body: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "notifications" }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

const activityEventSchema = new Schema(
  {
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subjectUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    eventType: { type: String, required: true, maxlength: 120 },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true, collection: "activity_events" }
);

activityEventSchema.index({ actorUserId: 1, createdAt: -1 });
activityEventSchema.index({ subjectUserId: 1, createdAt: -1 });
activityEventSchema.index({ eventType: 1, createdAt: -1 });
activityEventSchema.index({ createdAt: -1 });

const assessmentResultSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    englishLevel: { type: String, default: null, maxlength: 60 },
    careerReadinessScore: { type: Number, default: null },
    strengths: { type: [String], default: undefined },
    improvementAreas: { type: [String], default: undefined },
    recommendedAcademies: { type: [String], default: undefined },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "assessment_results" }
);

assessmentResultSchema.index({ userId: 1, completedAt: -1 });

const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 190 },
    organization: { type: String, default: null, trim: true, maxlength: 160 },
    inquiryType: { type: String, enum: INQUIRY_TYPES, default: "other" },
    subject: { type: String, required: true, trim: true, maxlength: 190 },
    message: { type: String, required: true, maxlength: 5000 },
    locale: { type: String, default: "en", maxlength: 10 },
    status: { type: String, enum: CONTACT_STATUSES, default: "new" },
    ipAddress: { type: String, default: null, maxlength: 45 },
    userAgent: { type: String, default: null, maxlength: 255 },
  },
  { timestamps: true, collection: "contact_messages" }
);

contactMessageSchema.index({ status: 1, createdAt: -1 });
contactMessageSchema.index({ email: 1, createdAt: -1 });
contactMessageSchema.index({ ipAddress: 1, createdAt: -1 });

// `mongoose.models.X ||` keeps re-requiring this file (tests, scripts) from
// throwing OverwriteModelError.
const User = mongoose.models.User || mongoose.model("User", userSchema);
const Notification =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
const ActivityEvent =
  mongoose.models.ActivityEvent || mongoose.model("ActivityEvent", activityEventSchema);
const AssessmentResult =
  mongoose.models.AssessmentResult ||
  mongoose.model("AssessmentResult", assessmentResultSchema);
const ContactMessage =
  mongoose.models.ContactMessage || mongoose.model("ContactMessage", contactMessageSchema);

const spanishAttemptSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    academyId: { type: String, default: "spanish-academy" },
    userId: { type: String, required: true, index: true },
    backgroundId: { type: String, required: true },
    goalId: { type: String, required: true },
    startLevel: { type: String, required: true },
    specialty: { type: String, required: true },
    form: { type: Schema.Types.Mixed, required: true },
    answers: { type: Schema.Types.Mixed, default: () => ({}) },
    artifacts: { type: Schema.Types.Mixed, default: () => ({}) },
    status: { type: String, enum: ["in_progress", "submitted"], default: "in_progress" },
    scores: { type: Schema.Types.Mixed, default: null },
    profile: { type: Schema.Types.Mixed, default: null },
    credential: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true, collection: "spanish_attempts" }
);

spanishAttemptSchema.index({ userId: 1, updatedAt: -1 });

const spanishPurchaseSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    product: { type: String, enum: ["diagnostic", "membership"], required: true },
    amountUsd: { type: Number, required: true },
    status: { type: String, enum: ["paid"], default: "paid" },
    paidAt: { type: Date, default: Date.now },
    stripeSessionId: { type: String, default: null, index: true },
  },
  { timestamps: true, collection: "spanish_purchases" }
);

spanishPurchaseSchema.index({ userId: 1, product: 1 }, { unique: true });

const spanishSimulationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    scenarioId: { type: String, required: true },
    nodeId: { type: String, required: true },
    history: { type: Schema.Types.Mixed, default: [] },
    score: { type: Number, default: null },
    status: { type: String, enum: ["in_progress", "complete"], default: "in_progress" },
  },
  { timestamps: true, collection: "spanish_simulations" }
);

const simulationSessionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    simulationId: { type: String, required: true, index: true },
    variationId: { type: String, default: null },
    status: { type: String, enum: ["active", "complete"], default: "active" },
    turnNumber: { type: Number, default: 1 },
    collected: { type: [String], default: [] },
    turns: { type: Schema.Types.Mixed, default: [] },
    evaluation: { type: Schema.Types.Mixed, default: null },
    feedback: { type: Schema.Types.Mixed, default: null },
    previousSessionId: { type: String, default: null },
    variationMeta: { type: Schema.Types.Mixed, default: null },
    lastPronunciation: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true, collection: "simulation_sessions" }
);

const simulationAssignmentSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    teacherId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    simulationId: { type: String, required: true },
    dueAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "simulation_assignments" }
);

const spanishVideoProgressSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    videoId: { type: String, required: true, index: true },
    status: { type: String, enum: ["in_progress", "complete"], default: "in_progress" },
    maxContinuousSec: { type: Number, default: 0 },
    lastPositionSec: { type: Number, default: 0 },
    durationSec: { type: Number, default: 0 },
    seekResetCount: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "spanish_video_progress" }
);

spanishVideoProgressSchema.index({ userId: 1, videoId: 1 }, { unique: true });

const SpanishAttempt =
  mongoose.models.SpanishAttempt || mongoose.model("SpanishAttempt", spanishAttemptSchema);
const SpanishPurchase =
  mongoose.models.SpanishPurchase || mongoose.model("SpanishPurchase", spanishPurchaseSchema);
const SpanishSimulation =
  mongoose.models.SpanishSimulation ||
  mongoose.model("SpanishSimulation", spanishSimulationSchema);
const SimulationSession =
  mongoose.models.SimulationSession ||
  mongoose.model("SimulationSession", simulationSessionSchema);
const SimulationAssignment =
  mongoose.models.SimulationAssignment ||
  mongoose.model("SimulationAssignment", simulationAssignmentSchema);
const SpanishVideoProgress =
  mongoose.models.SpanishVideoProgress ||
  mongoose.model("SpanishVideoProgress", spanishVideoProgressSchema);

module.exports = {
  User,
  Notification,
  ActivityEvent,
  AssessmentResult,
  ContactMessage,
  SpanishAttempt,
  SpanishPurchase,
  SpanishSimulation,
  SimulationSession,
  SimulationAssignment,
  SpanishVideoProgress,
  USER_ROLES,
  INQUIRY_TYPES,
  CONTACT_STATUSES,
};
