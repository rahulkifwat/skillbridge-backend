const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const controller = require("../controllers/blueprintController");

const router = express.Router();

// Production Master Blueprint modules — SBS-2026-PRODUCTION-002.
router.get("/modules", requireAuth, controller.listAll);
router.get("/modules/:lessonId", requireAuth, controller.getModule);
router.post("/modules/:lessonId/sessions", requireAuth, controller.startSession);

router.get("/sessions/:sessionId", requireAuth, controller.getSession);
router.post("/sessions/:sessionId/video-position", requireAuth, controller.recordVideoPosition);
router.post("/sessions/:sessionId/stages/:stageId", requireAuth, controller.submitStage);
router.post("/sessions/:sessionId/review", requireAuth, controller.submitReview);
router.get("/sessions/:sessionId/lms-export", requireAuth, controller.exportLms);

router.post(
  "/sessions/:sessionId/release-hold",
  requireAuth,
  requireRole("instructor", "administrator", "super_admin"),
  controller.releaseHold
);

module.exports = router;
