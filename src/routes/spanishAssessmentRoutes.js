const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const controller = require("../controllers/spanishAssessmentController");

const router = express.Router();

router.use(requireAuth);

router.get("/billing", controller.billing);
router.post(
  "/billing/checkout",
  [body("product").isIn(["diagnostic", "membership"])],
  validate,
  controller.checkout
);
router.get("/billing/confirm", controller.confirmCheckout);
router.post("/billing/confirm", controller.confirmCheckout);

router.post(
  "/assessment/start",
  [
    body("backgroundId").isString().isLength({ min: 2, max: 40 }),
    body("goalId").isString().isLength({ min: 2, max: 40 }),
  ],
  validate,
  controller.start
);

router.get("/assessment/:attemptId/section/:skill", controller.section);
router.post("/assessment/:attemptId/answers", controller.saveAnswers);
router.get("/assessment/:attemptId/review", controller.review);
router.post("/assessment/:attemptId/submit", controller.submit);
router.get("/profile", controller.profile);
router.get("/learning", controller.learning);
router.get("/credentials", controller.credentials);
router.get("/simulations", controller.listSimulations);
router.post("/simulations/start", controller.startSimulation);
router.post("/simulations/:runId/choose", controller.chooseSimulation);

module.exports = router;
