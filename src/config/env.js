require("dotenv").config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",

  // Origins allowed to call the API, e.g. "http://localhost:2003,http://localhost:3000"
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:2003")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),

  db: {
    // Full MongoDB connection string, including credentials. Never commit this.
    uri: required("MONGODB_URI", "mongodb://127.0.0.1:27017/skillbridge"),
    // Overrides the database named in the URI path when set.
    name: process.env.MONGODB_DB || "",
  },

  jwtSecret: required("JWT_SECRET", "skillbridge-dev-secret"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 10),

  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:2003",
  apiPublicUrl: process.env.API_PUBLIC_URL || `http://localhost:${Number(process.env.PORT || 5000)}`,
  oauth: {
    googleClientId: process.env.GOOGLE_CLIENT_ID || "",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    microsoftClientId: process.env.MICROSOFT_CLIENT_ID || "",
    microsoftClientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
    appleClientId: process.env.APPLE_CLIENT_ID || "",
    appleClientSecret: process.env.APPLE_CLIENT_SECRET || "",
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  },

  // Production AI — empty means the curriculum engine and Loop Core run locally.
  // Skillbridge funds the live token budget; never commit secrets.
  ai: {
    openaiKey: process.env.OPENAI_API_KEY || "",
    openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
    anthropicKey: process.env.ANTHROPIC_API_KEY || "",
    anthropicModel: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
    monthlyBudgetUsd: Number(process.env.AI_MONTHLY_BUDGET_USD || 75),
  },
  videoProduction: {
    heygenKey: process.env.HEYGEN_API_KEY || "",
    synthesiaKey: process.env.SYNTHESIA_API_KEY || "",
    elevenLabsKey: process.env.ELEVENLABS_API_KEY || "",
    assetBucket: process.env.VIDEO_ASSET_BUCKET_URL || "",
  },
};

module.exports = env;
