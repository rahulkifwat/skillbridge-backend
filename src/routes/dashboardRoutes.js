const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const dashboardController = require("../controllers/dashboardController");

const router = express.Router();

router.get("/overview", requireAuth, dashboardController.overview);
router.get("/notifications", requireAuth, dashboardController.notifications);
router.get("/activity", requireAuth, dashboardController.activity);
router.get(
  "/status",
  requireAuth,
  requireRole("administrator", "super_admin"),
  dashboardController.status
);

module.exports = router;
