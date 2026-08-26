/**
 * MongoDB has no DDL step — collections appear on first write. What does need
 * applying is the index set declared on the schemas, which is what this does.
 * Safe to run repeatedly: syncIndexes() creates what is missing and drops
 * indexes the schema no longer declares.
 *
 * Run with:  npm run db:migrate
 */
const { connectDatabase, disconnectDatabase, databaseName } = require("../config/db");
const { User, Notification, ActivityEvent, AssessmentResult, ContactMessage } = require("../models/schemas");

const MODELS = [User, Notification, ActivityEvent, AssessmentResult, ContactMessage];

async function migrate() {
  await connectDatabase();

  for (const model of MODELS) {
    await model.createCollection().catch((error) => {
      // NamespaceExists (48) just means a previous run already made it.
      if (error.code !== 48) throw error;
    });
    await model.syncIndexes();
    console.log(`  ${model.collection.collectionName.padEnd(20)} indexes synced`);
  }

  console.log(`\n✔ Indexes applied to database "${databaseName()}".`);
}

migrate()
  .then(() => disconnectDatabase())
  .catch(async (error) => {
    console.error("✖ Migration failed:", error.message);
    await disconnectDatabase().catch(() => {});
    process.exit(1);
  });
