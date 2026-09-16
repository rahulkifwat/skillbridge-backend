const ACADEMY_SPANISH = "spanish";
const ACADEMY_GLOBAL = "global";

function resolveAcademy(existing, requested) {
  if (existing === ACADEMY_SPANISH || requested === ACADEMY_SPANISH) return ACADEMY_SPANISH;
  return ACADEMY_GLOBAL;
}

function isSpanishAcademy(user) {
  return Boolean(user && user.academy === ACADEMY_SPANISH);
}

module.exports = { ACADEMY_SPANISH, ACADEMY_GLOBAL, resolveAcademy, isSpanishAcademy };
