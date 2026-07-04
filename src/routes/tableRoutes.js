const express = require("express");
const { getAllCourses } = require("../models/courseModel");
const { getAllSessions } = require("../models/sessionModel");
const { getAllVocabulary } = require("../models/vocabularyModel");
const { getAllOccurrences } = require("../models/occurrenceModel");
const { getAllReviewLogs } = require("../models/reviewLogModel");

const router = express.Router();

router.get("/courses", (req, res) => {
  try {
    const rows = getAllCourses();
    res.json({ count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/sessions", (req, res) => {
  try {
    const rows = getAllSessions();
    res.json({ count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/vocabulary", (req, res) => {
  try {
    const rows = getAllVocabulary();
    res.json({ count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/occurrences", (req, res) => {
  try {
    const rows = getAllOccurrences();
    res.json({ count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/reviewlogs", (req, res) => {
  try {
    const rows = getAllReviewLogs();
    res.json({ count: rows.length, data: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
