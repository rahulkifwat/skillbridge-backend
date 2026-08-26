/**
 * Inserts demo accounts so the login screen is usable straight away.
 * Existing emails are left untouched — rerun as often as you like.
 */
const bcrypt = require("bcryptjs");
const { connectDatabase, disconnectDatabase } = require("../config/db");
const { User } = require("../models/schemas");
const env = require("../config/env");

const DEMO_USERS = [
  {
    fullName: "Alex Rivera",
    email: "alex@skillbridge.com",
    password: "Skill@1234",
    role: "student",
    persona: "college-student",
  },
  {
    fullName: "Maria Gomez",
    email: "maria@skillbridge.com",
    password: "Skill@1234",
    role: "student",
    persona: "high-school-student",
  },
  {
    fullName: "SkillBridge Administrator",
    email: "admin@skillbridge.com",
    password: "Admin@1234",
    role: "administrator",
    persona: null,
  },
  {
    fullName: "Jordan Lee",
    email: "instructor@skillbridge.com",
    password: "Skill@1234",
    role: "instructor",
    persona: null,
  },
  {
    fullName: "Acme Hiring",
    email: "employer@skillbridge.com",
    password: "Skill@1234",
    role: "employer",
    persona: null,
  },
  {
    fullName: "Growth Partners",
    email: "partner@skillbridge.com",
    password: "Skill@1234",
    role: "partner",
    persona: null,
  },
  {
    fullName: "SkillBridge Super Admin",
    email: "superadmin@skillbridge.com",
    password: "Skill@1234",
    role: "super_admin",
    persona: null,
  },
];

async function seed() {
  await connectDatabase();

  for (const user of DEMO_USERS) {
    const existing = await User.exists({ email: user.email });
    if (existing) {
      console.log(`  ${user.email.padEnd(28)} already exists`);
      continue;
    }

    await User.create({
      fullName: user.fullName,
      email: user.email,
      passwordHash: await bcrypt.hash(user.password, env.bcryptRounds),
      role: user.role,
      persona: user.persona,
    });
    console.log(`  ${user.email.padEnd(28)} created`);
  }

  console.log("\n✔ Seed complete. Demo password: Skill@1234 (admin: Admin@1234)");
}

seed()
  .then(() => disconnectDatabase())
  .catch(async (error) => {
    console.error("✖ Seed failed:", error.message);
    await disconnectDatabase().catch(() => {});
    process.exit(1);
  });
