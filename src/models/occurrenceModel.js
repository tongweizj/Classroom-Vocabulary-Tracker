const db = require("../db/database");

function upsertOccurrence({
  itemId,
  sessionId,
  frequency,
  frequencyLevel,
  exampleSentence,
  speaker
}) {
  const existing = db
    .prepare(`
      SELECT * FROM item_occurrences
      WHERE item_id = ? AND session_id = ?
    `)
    .get(itemId, sessionId);

  if (existing) {
    db.prepare(`
      UPDATE item_occurrences
      SET
        frequency = frequency + ?,
        frequency_level = COALESCE(?, frequency_level),
        example_sentence = COALESCE(?, example_sentence),
        speaker = COALESCE(?, speaker)
      WHERE id = ?
    `).run(
      frequency || 1,
      frequencyLevel || null,
      exampleSentence || null,
      speaker || "Teacher",
      existing.id
    );

    return db.prepare("SELECT * FROM item_occurrences WHERE id = ?").get(existing.id);
  }

  const result = db.prepare(`
    INSERT INTO item_occurrences (
      item_id,
      session_id,
      frequency,
      frequency_level,
      example_sentence,
      speaker
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    itemId,
    sessionId,
    frequency || 1,
    frequencyLevel || null,
    exampleSentence || null,
    speaker || "Teacher"
  );

  return db.prepare("SELECT * FROM item_occurrences WHERE id = ?").get(result.lastInsertRowid);
}

function getAllOccurrences() {
  return db.prepare(`
    SELECT o.*, v.expression, v.type AS vocab_type, v.chinese_meaning,
           s.session_date, s.topic AS session_topic,
           c.course_code, c.course_name
    FROM item_occurrences o
    LEFT JOIN vocabulary_items v ON o.item_id = v.id
    LEFT JOIN class_sessions s ON o.session_id = s.id
    LEFT JOIN courses c ON s.course_id = c.id
    ORDER BY o.id DESC
  `).all();
}

module.exports = {
  upsertOccurrence,
  getAllOccurrences
};