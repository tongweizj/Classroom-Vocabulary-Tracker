const express = require("express");
const multer = require("multer");
const path = require("path");
const { importVocabularyFromExcel } = require("../services/importVocabService");
const { getVocabularyWithPriority } = require("../models/vocabularyModel");

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, "../../uploads")
});

router.post("/vocabulary", upload.single("file"), (req, res) => {
  try {
    const {
      courseCode,
      courseName,
      teacherName,
      semester,
      sessionDate,
      topic,
      rawTranscriptPath,
      cleanedTranscriptPath,
      summary
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "Excel file is required."
      });
    }

    if (!courseCode || !sessionDate) {
      return res.status(400).json({
        message: "courseCode and sessionDate are required."
      });
    }

    const result = importVocabularyFromExcel(req.file.path, {
      courseCode,
      courseName,
      teacherName,
      semester,
      sessionDate,
      topic,
      rawTranscriptPath,
      cleanedTranscriptPath,
      summary
    });

    res.json({
      message: "Vocabulary imported successfully.",
      result
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to import vocabulary.",
      error: error.message
    });
  }
});

router.get("/vocabulary/priority", (req, res) => {
  try {
    const rows = getVocabularyWithPriority();

    res.json({
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch vocabulary priority list.",
      error: error.message
    });
  }
});

module.exports = router;