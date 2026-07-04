const db = require("../db/database");

function getAllReviewLogs() {
  return db.prepare(`
    SELECT r.*, v.expression, v.type AS vocab_type, v.chinese_meaning
    FROM review_logs r
    LEFT JOIN vocabulary_items v ON r.item_id = v.id
    ORDER BY r.review_date DESC
  `).all();
}

module.exports = {
  getAllReviewLogs
};
