const db = require("../db/database");

function findOrCreateCourse({ courseCode, courseName, teacherName, semester }) {
  const existing = db
    .prepare("SELECT * FROM courses WHERE course_code = ?")
    .get(courseCode);

  if (existing) return existing;

  const result = db
    .prepare(`
      INSERT INTO courses (course_code, course_name, teacher_name, semester)
      VALUES (?, ?, ?, ?)
    `)
    .run(courseCode, courseName || null, teacherName || null, semester || null);

  return db.prepare("SELECT * FROM courses WHERE id = ?").get(result.lastInsertRowid);
}

module.exports = {
  findOrCreateCourse
};