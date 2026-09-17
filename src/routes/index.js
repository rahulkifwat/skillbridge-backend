const express = require("express");
const authRoutes = require("./authRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const contactRoutes = require("./contactRoutes");
const spanishAssessmentRoutes = require("./spanishAssessmentRoutes");
const simulationMasterRoutes = require("./simulationMasterRoutes");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, service: "skillbridge-api", uptime: process.uptime() });
});

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/contact", contactRoutes);
router.use("/spanish", spanishAssessmentRoutes);
router.use("/v1", simulationMasterRoutes);

module.exports = router;
