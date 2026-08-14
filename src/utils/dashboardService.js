const DASHBOARD_SUMMARIES = {
  student: { title: "Student Dashboard", description: "Your learning, career readiness, and opportunities in one place.", metrics: [{ label: "Learning progress", value: "72%" }, { label: "Achievements", value: "8" }, { label: "Job readiness", value: "76" }] },
  instructor: { title: "Instructor & Content Management", description: "Create engaging learning experiences and support student progress.", metrics: [{ label: "Active courses", value: "12" }, { label: "Learners", value: "284" }, { label: "Pending reviews", value: "9" }] },
  employer: { title: "Employer Dashboard", description: "Find verified, job-ready talent for your distributed team.", metrics: [{ label: "Open roles", value: "6" }, { label: "Recommended talent", value: "42" }, { label: "Interviews", value: "5" }] },
  administrator: { title: "Administrator Dashboard", description: "Operate the platform, manage users, and keep SkillBridge healthy.", metrics: [{ label: "Active users", value: "2,486" }, { label: "Support tickets", value: "18" }, { label: "Open reviews", value: "11" }] },
  partner: { title: "Partner Dashboard", description: "Track sponsored learners, cohorts, and measurable impact.", metrics: [{ label: "Sponsored learners", value: "156" }, { label: "Active cohorts", value: "4" }, { label: "Completion rate", value: "84%" }] },
  super_admin: { title: "Super Administrator Dashboard", description: "Configure global systems, policies, access, and platform operations.", metrics: [{ label: "System health", value: "99.98%" }, { label: "Security events", value: "0" }, { label: "Active regions", value: "3" }] },
};

function getOverview(role) { return DASHBOARD_SUMMARIES[role] || DASHBOARD_SUMMARIES.student; }

module.exports = { getOverview };
