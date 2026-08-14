const express = require("express");
const authRoutes = require("./authRoutes");
const dashboardRoutes = require("./dashboardRoutes");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, service: "skillbridge-api", uptime: process.uptime() });
});

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);

module.exports = router;
