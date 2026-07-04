const xlsx = require("xlsx");
const db = require("../db/database");
const { findOrCreateCourse } = require("../models/courseModel");
const { findOrCreateSession } = require("../models/sessionModel");
const { findOrCreateVocabularyItem } = require("../models/vocabularyModel");
const { upsertOccurrence } = require("../models/occurrenceModel");
const { toIntegerOrNull } = require("../utils/normalize");

function mapExcelRow(row) {
  return {
    type: row["类型"] || row["type"],
    expression: row["英文表达"] || row["expression"],
    chineseMeaning: row["中文意思"] || row["chinese_meaning"],
    frequency: toIntegerOrNull(row["出现频率"] || row["frequency"]) || 1,
    frequencyLevel: toIntegerOrNull(row["频率等级"] || row["frequency_level"]),
    exampleSentence: row["课堂原句"] || row["example_sentence"],
    importanceScore: row["重要性评分"] || row["importance_score"],
    reusabilityScore: row["可复用性评分"] || row["reusability_score"],
    familiarityScore: row["熟悉度评分"] || row["familiarity_score"],
    treatment: row["建议处理方式"] || row["treatment"],
    speaker: row["说话人"] || row["speaker"] || "Teacher"
  };
}

function importVocabularyFromExcel(filePath, metadata) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = xlsx.utils.sheet_to_json(sheet, {
    defval: ""
  });

  const course = findOrCreateCourse({
    courseCode: metadata.courseCode,
    courseName: metadata.courseName,
    teacherName: metadata.teacherName,
    semester: metadata.semester
  });

  const session = findOrCreateSession({
    courseId: course.id,
    sessionDate: metadata.sessionDate,
    topic: metadata.topic,
    rawTranscriptPath: metadata.rawTranscriptPath,
    cleanedTranscriptPath: metadata.cleanedTranscriptPath,
    summary: metadata.summary
  });

  const transaction = db.transaction(() => {
    let importedCount = 0;
    let skippedCount = 0;

    for (const rawRow of rows) {
      const row = mapExcelRow(rawRow);

      if (!row.type || !row.expression) {
        skippedCount++;
        continue;
      }

      const item = findOrCreateVocabularyItem(row);

      upsertOccurrence({
        itemId: item.id,
        sessionId: session.id,
        frequency: row.frequency,
        frequencyLevel: row.frequencyLevel,
        exampleSentence: row.exampleSentence,
        speaker: row.speaker
      });

      importedCount++;
    }

    return {
      course,
      session,
      importedCount,
      skippedCount,
      totalRows: rows.length
    };
  });

  return transaction();
}

module.exports = {
  importVocabularyFromExcel
};