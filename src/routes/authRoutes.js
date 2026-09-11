const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const authController = require("../controllers/authController");

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
  ],
  validate,
  authController.register
);

router.post(
  "/login",
  [
    body("email").trim().isEmail().withMessage("Enter a valid email address."),
    body("password").notEmpty().withMessage("Enter your password."),
  ],
  validate,
  authController.login
);

router.get("/me", requireAuth, authController.me);
router.post("/logout", authController.logout);

module.exports = router;
