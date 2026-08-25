const express = require("express");
const authRoutes = require("./authRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const contactRoutes = require("./contactRoutes");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, service: "skillbridge-api", uptime: process.uptime() });
});

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/contact", contactRoutes);

module.exports = router;
