const rows = new Map();

function key(userId, formId) {
  return `${userId}:${formId}`;
}

async function saveForm({ userId, formId, lessonId, fields }) {
  const record = {
    id: key(userId, formId),
    userId,
    formId,
    lessonId: lessonId || null,
    fields: fields || {},
    updatedAt: new Date().toISOString(),
  };
  rows.set(record.id, record);
  return record;
}

async function listForUser(userId) {
  return [...rows.values()].filter((row) => row.userId === userId);
}

function resetStore() {
  rows.clear();
}

module.exports = { saveForm, listForUser, resetStore };
