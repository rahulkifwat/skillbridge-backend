const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const contactController = require("../controllers/contactController");

const router = express.Router();

// Kept in sync with the "I am a" options on the public contact form.
const INQUIRY_TYPES = [
  "student",
  "employer",
  "university",
  "school",
  "government",
  "partner",
  "other",
];

router.post(
  "/",
  [
    body("name").trim().isLength({ min: 2, max: 120 }).withMessage("Enter your name."),
    body("email").trim().isEmail().withMessage("Enter a valid email address."),
    body("organization").optional({ values: "falsy" }).trim().isLength({ max: 160 }),
    body("inquiryType").optional({ values: "falsy" }).isIn(INQUIRY_TYPES),
    body("subject").trim().isLength({ min: 2, max: 190 }).withMessage("Enter a subject."),
    body("message").trim().isLength({ min: 10, max: 5000 }).withMessage("Enter your message."),
    body("locale").optional({ values: "falsy" }).trim().isLength({ max: 10 }),
  ],
  validate,
  contactController.submit
);

router.get("/", requireAuth, requireRole("administrator", "super_admin"), contactController.list);

module.exports = router;
