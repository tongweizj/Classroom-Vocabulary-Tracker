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

module.exports = {
  upsertOccurrence
};