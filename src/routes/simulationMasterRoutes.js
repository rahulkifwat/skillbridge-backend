const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const controller = require("../controllers/simulationMasterController");

const router = express.Router();

router.get("/spanish/programs", requireAuth, controller.listPrograms);
router.get("/simulations", requireAuth, controller.listSimulations);
router.get("/simulations/:simulationId", requireAuth, controller.getSimulation);
router.post("/simulations/:simulationId/start", requireAuth, controller.startSimulation);
router.post("/simulation-sessions/:sessionId/responses", requireAuth, controller.submitResponse);
router.post("/simulation-sessions/:sessionId/complete", requireAuth, controller.completeSession);
router.post("/simulation-sessions/:sessionId/retry", requireAuth, controller.retrySession);
router.get("/simulation-sessions/:sessionId", requireAuth, controller.getSession);
router.get("/simulation-sessions/:sessionId/results", requireAuth, controller.getResults);
router.get("/simulation-history", requireAuth, controller.history);

router.get(
  "/teacher/students",
  requireAuth,
  requireRole("instructor", "administrator", "super_admin"),
  controller.teacherStudents
);
router.get(
  "/teacher/students/:id/simulation-results",
  requireAuth,
  requireRole("instructor", "administrator", "super_admin"),
  controller.teacherStudentResults
);
router.post(
  "/teacher/assignments",
  requireAuth,
  requireRole("instructor", "administrator", "super_admin"),
  controller.createAssignment
);
router.get(
  "/teacher/analytics",
  requireAuth,
  requireRole("instructor", "administrator", "super_admin"),
  controller.teacherAnalytics
);

router.post(
  "/admin/scenarios",
  requireAuth,
  requireRole("administrator", "super_admin"),
  controller.createScenario
);
router.put(
  "/admin/scenarios/:id",
  requireAuth,
  requireRole("administrator", "super_admin"),
  controller.updateScenario
);
router.post(
  "/admin/scenarios/:id/publish",
  requireAuth,
  requireRole("administrator", "super_admin"),
  controller.publishScenario
);
router.post(
  "/admin/scenarios/:id/archive",
  requireAuth,
  requireRole("administrator", "super_admin"),
  controller.archiveScenario
);

module.exports = router;
