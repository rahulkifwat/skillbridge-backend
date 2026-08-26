const mongoose = require("mongoose");
const env = require("./env");

// Reject writes against fields the schemas don't declare, and surface bad
// ObjectId casts as validation errors rather than silent nulls.
mongoose.set("strictQuery", true);

let connectionPromise = null;

/**
 * Opens the shared connection. Mongoose keeps one internal pool per process,
 * so calling this more than once reuses the same connection.
 */
function connectDatabase() {
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.db.uri, {
        ...(env.db.name ? { dbName: env.db.name } : {}),
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
      })
      .then((instance) => instance.connection);
  }
  return connectionPromise;
}

async function disconnectDatabase() {
  connectionPromise = null;
  await mongoose.disconnect();
}

// Called at boot so a bad connection string fails loudly instead of on the
// first request.
async function assertConnection() {
  const connection = await connectDatabase();
  await connection.db.admin().command({ ping: 1 });
  return connection;
}

// The database the connection actually resolved to — handy for boot logging,
// since the name can come from the URI path or MONGODB_DB.
function databaseName() {
  return mongoose.connection?.name || env.db.name || "(unknown)";
}

module.exports = {
  mongoose,
  connectDatabase,
  disconnectDatabase,
  assertConnection,
  databaseName,
};
