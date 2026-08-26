const app = require("./src/app");
const env = require("./src/config/env");
const { assertConnection, databaseName } = require("./src/config/db");

async function start() {
  try {
    await assertConnection();
    console.log(`✔ Connected to MongoDB database "${databaseName()}".`);
  } catch (error) {
    console.error("✖ Could not connect to MongoDB:", error.message);
    console.error("  Check MONGODB_URI in backend/.env");
    console.error("  For Atlas, also confirm this machine's IP is allowed in Network Access.");
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`✔ SkillBridge API listening on http://localhost:${env.port}/api`);
    console.log(`  Allowed origins: ${env.corsOrigins.join(", ")}`);
  });
}

start();
