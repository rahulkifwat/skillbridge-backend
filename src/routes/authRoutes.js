const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const authController = require("../controllers/authController");
const oauthController = require("../controllers/oauthController");

const router = express.Router();

const PUBLIC_ROLES = ["student", "instructor", "employer", "partner"];

router.post(
  "/register",
  [
    body("fullName").trim().isLength({ min: 2, max: 120 }).withMessage("Enter your full name."),
    body("email").trim().isEmail().withMessage("Enter a valid email address.").normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters."),
    body("role").optional().isIn(PUBLIC_ROLES).withMessage("Choose a valid account type."),
    body("persona").optional({ values: "null" }).isString(),
    body("academy").optional().isIn(["spanish", "global"]).withMessage("Choose a valid academy."),
  ],
  validate,
  authController.register
);

router.post(
  "/login",
  [
    body("email").trim().isEmail().withMessage("Enter a valid email address."),
    body("password").notEmpty().withMessage("Enter your password."),
    body("academy").optional().isIn(["spanish", "global"]).withMessage("Choose a valid academy."),
  ],
  validate,
  authController.login
);

router.get("/oauth/providers", oauthController.providers);
router.get("/oauth/:provider", oauthController.start);
router.get("/oauth/:provider/callback", oauthController.callback);

router.get("/me", requireAuth, authController.me);
router.post("/logout", authController.logout);

module.exports = router;
