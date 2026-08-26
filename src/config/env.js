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
};

module.exports = env;
