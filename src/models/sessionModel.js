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

function getAllSessions() {
  return db.prepare(`
    SELECT s.*, c.course_code, c.course_name
    FROM class_sessions s
    LEFT JOIN courses c ON s.course_id = c.id
    ORDER BY s.session_date DESC
  `).all();
}

module.exports = {
  findOrCreateSession,
  getAllSessions
};