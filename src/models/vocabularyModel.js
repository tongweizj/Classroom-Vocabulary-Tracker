const db = require("../db/database");
const {
  normalizeExpression,
  toIntegerOrNull,
  detectIsFiller
} = require("../utils/normalize");

function findOrCreateVocabularyItem(row) {
  const type = row.type;
  const expression = row.expression;
  const normalizedExpression = normalizeExpression(expression);

  if (!type || !expression || !normalizedExpression) {
    throw new Error("type and expression are required.");
  }

  const existing = db
    .prepare(`
      SELECT * FROM vocabulary_items
      WHERE type = ? AND normalized_expression = ?
    `)
    .get(type, normalizedExpression);

  const importanceScore = toIntegerOrNull(row.importanceScore);
  const reusabilityScore = toIntegerOrNull(row.reusabilityScore);
  const familiarityScore = toIntegerOrNull(row.familiarityScore);
  const isFiller = detectIsFiller(type, expression);

  if (existing) {
    db.prepare(`
      UPDATE vocabulary_items
      SET
        chinese_meaning = COALESCE(?, chinese_meaning),
        importance_score = COALESCE(?, importance_score),
        reusability_score = COALESCE(?, reusability_score),
        familiarity_score = COALESCE(?, familiarity_score),
        treatment = COALESCE(?, treatment),
        is_filler = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      row.chineseMeaning || null,
      importanceScore,
      reusabilityScore,
      familiarityScore,
      row.treatment || null,
      isFiller,
      existing.id
    );

    return db.prepare("SELECT * FROM vocabulary_items WHERE id = ?").get(existing.id);
  }

  const result = db.prepare(`
    INSERT INTO vocabulary_items (
      type,
      expression,
      normalized_expression,
      chinese_meaning,
      importance_score,
      reusability_score,
      familiarity_score,
      treatment,
      is_filler
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    type,
    expression,
    normalizedExpression,
    row.chineseMeaning || null,
    importanceScore,
    reusabilityScore,
    familiarityScore,
    row.treatment || null,
    isFiller
  );

  return db.prepare("SELECT * FROM vocabulary_items WHERE id = ?").get(result.lastInsertRowid);
}

function getVocabularyWithPriority() {
  return db.prepare(`
    SELECT
      v.id,
      v.type,
      v.expression,
      v.chinese_meaning,
      COALESCE(SUM(o.frequency), 0) AS total_frequency,

      CASE
        WHEN v.is_filler = 1 THEN
          CASE
            WHEN COALESCE(SUM(o.frequency), 0) >= 10 THEN 2
            ELSE 1
          END
        WHEN COALESCE(SUM(o.frequency), 0) >= 21 THEN 5
        WHEN COALESCE(SUM(o.frequency), 0) >= 11 THEN 4
        WHEN COALESCE(SUM(o.frequency), 0) >= 6 THEN 3
        WHEN COALESCE(SUM(o.frequency), 0) >= 3 THEN 2
        ELSE 1
      END AS frequency_level,

      v.importance_score,
      v.reusability_score,
      v.familiarity_score,

      CASE
        WHEN v.familiarity_score IS NULL THEN NULL
        ELSE 6 - v.familiarity_score
      END AS unfamiliarity,

      CASE
        WHEN v.familiarity_score IS NULL THEN NULL
        ELSE
          COALESCE(v.importance_score, 0)
          + COALESCE(v.reusability_score, 0)
          + CASE
              WHEN v.is_filler = 1 THEN
                CASE
                  WHEN COALESCE(SUM(o.frequency), 0) >= 10 THEN 2
                  ELSE 1
                END
              WHEN COALESCE(SUM(o.frequency), 0) >= 21 THEN 5
              WHEN COALESCE(SUM(o.frequency), 0) >= 11 THEN 4
              WHEN COALESCE(SUM(o.frequency), 0) >= 6 THEN 3
              WHEN COALESCE(SUM(o.frequency), 0) >= 3 THEN 2
              ELSE 1
            END
          + (6 - v.familiarity_score)
      END AS learning_priority,

      v.treatment,
      v.is_filler

    FROM vocabulary_items v
    LEFT JOIN item_occurrences o ON v.id = o.item_id
    GROUP BY v.id
    ORDER BY
      v.importance_score DESC,
      v.reusability_score DESC,
      learning_priority DESC,
      total_frequency DESC
  `).all();
}

function getAllVocabulary() {
  return db.prepare("SELECT * FROM vocabulary_items ORDER BY id DESC").all();
}

module.exports = {
  findOrCreateVocabularyItem,
  getVocabularyWithPriority,
  getAllVocabulary
};