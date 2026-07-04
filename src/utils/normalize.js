function normalizeExpression(expression) {
  if (!expression) return "";

  return String(expression)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[“”"]/g, "")
    .replace(/[‘’']/g, "")
    .replace(/[.,!?;:]+$/g, "");
}

function toIntegerOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function detectIsFiller(type, expression) {
  const normalizedType = normalizeExpression(type);
  const normalizedExpression = normalizeExpression(expression);

  const fillerExpressions = [
    "okay",
    "you know",
    "kind of",
    "or something",
    "like",
    "um",
    "uh"
  ];

  if (normalizedType.includes("口头禅")) return 1;
  if (normalizedType.includes("filler")) return 1;
  if (fillerExpressions.includes(normalizedExpression)) return 1;

  return 0;
}

module.exports = {
  normalizeExpression,
  toIntegerOrNull,
  detectIsFiller
};