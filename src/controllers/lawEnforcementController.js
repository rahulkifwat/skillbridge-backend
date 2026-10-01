const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { unit, getLesson, FORMS } = require("../data/lawEnforcementUnit1");
const forms = require("../models/lawUnitFormStore");

const getUnit = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: unit() });
});

const saveClassroomForm = asyncHandler(async (req, res) => {
  const formId = String(req.body?.formId || "");
  if (!FORMS[formId]) throw ApiError.badRequest("Unknown classroom form.");
  const saved = await forms.saveForm({
    userId: req.user.id,
    formId,
    lessonId: req.body?.lessonId || null,
    fields: req.body?.fields || {},
  });
  res.status(201).json({
    success: true,
    data: { form: saved, notice: unit().academicNotice },
  });
});

const listClassroomForms = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { forms: await forms.listForUser(req.user.id) } });
});

const getLessonDetail = asyncHandler(async (req, res) => {
  const lesson = getLesson(req.params.lessonId);
  if (!lesson) throw ApiError.notFound("Lesson not found.");
  res.json({ success: true, data: { lesson, unit: unit(), form: FORMS[lesson.formId] || null } });
});

module.exports = { getUnit, saveClassroomForm, listClassroomForms, getLessonDetail };
