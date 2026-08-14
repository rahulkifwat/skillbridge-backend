const app = require("./src/app");
const env = require("./src/config/env");
const { assertConnection } = require("./src/config/db");

async function start() {
  try {
    await assertConnection();
    console.log(`✔ Connected to MySQL database "${env.db.database}".`);
  } catch (error) {
    console.error("✖ Could not connect to MySQL:", error.message);
    console.error("  Check DB_HOST / DB_USER / DB_PASSWORD / DB_NAME in backend/.env");
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`✔ SkillBridge API listening on http://localhost:${env.port}/api`);
    console.log(`  Allowed origins: ${env.corsOrigins.join(", ")}`);
  });
}

start();
