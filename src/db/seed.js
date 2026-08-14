/**
 * Inserts demo accounts so the login screen is usable straight away.
 * Existing emails are left untouched — rerun as often as you like.
 */
const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const env = require("../config/env");

const DEMO_USERS = [
  {
    full_name: "Alex Rivera",
    email: "alex@skillbridge.com",
    password: "Skill@1234",
    role: "student",
    persona: "college-student",
  },
  {
    full_name: "Maria Gomez",
    email: "maria@skillbridge.com",
    password: "Skill@1234",
    role: "student",
    persona: "high-school-student",
  },
  {
    full_name: "SkillBridge Administrator",
    email: "admin@skillbridge.com",
    password: "Admin@1234",
    role: "administrator",
    persona: null,
  },
  {
    full_name: "Jordan Lee",
    email: "instructor@skillbridge.com",
    password: "Skill@1234",
    role: "instructor",
    persona: null,
  },
  {
    full_name: "Acme Hiring",
    email: "employer@skillbridge.com",
    password: "Skill@1234",
    role: "employer",
    persona: null,
  },
  {
    full_name: "Growth Partners",
    email: "partner@skillbridge.com",
    password: "Skill@1234",
    role: "partner",
    persona: null,
  },
  {
    full_name: "SkillBridge Super Admin",
    email: "superadmin@skillbridge.com",
    password: "Skill@1234",
    role: "super_admin",
    persona: null,
  },
];

async function seed() {
  for (const user of DEMO_USERS) {
    const hash = await bcrypt.hash(user.password, env.bcryptRounds);
    const [result] = await pool.query(
      `INSERT IGNORE INTO users (full_name, email, password_hash, role, persona)
       VALUES (?, ?, ?, ?, ?)`,
      [user.full_name, user.email, hash, user.role, user.persona]
    );
    const status = result.affectedRows ? "created" : "already exists";
    console.log(`  ${user.email.padEnd(28)} ${status}`);
  }

  console.log("\n✔ Seed complete. Demo password: Skill@1234 (admin: Admin@1234)");
  await pool.end();
}

seed().catch(async (error) => {
  console.error("✖ Seed failed:", error.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
