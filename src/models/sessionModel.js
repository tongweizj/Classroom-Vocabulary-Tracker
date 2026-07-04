const db = require("../db/database");

function findOrCreateSession({
  courseId,
  sessionDate,
  topic,
  rawTranscriptPath,
  cleanedTranscriptPath,
  summary
}) {
  const existing = db
    .prepare(`
      SELECT * FROM class_sessions
      WHERE course_id = ? AND session_date = ? AND topic = ?
    `)
    .get(courseId, sessionDate, topic || "");

  if (existing) return existing;

  const result = db
    .prepare(`
      INSERT INTO class_sessions (
        course_id,
        session_date,
        topic,
        raw_transcript_path,
        cleaned_transcript_path,
        summary
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
      courseId,
      sessionDate,
      topic || "",
      rawTranscriptPath || null,
      cleanedTranscriptPath || null,
      summary || null
    );

  return db.prepare("SELECT * FROM class_sessions WHERE id = ?").get(result.lastInsertRowid);
}

module.exports = {
  findOrCreateSession
};