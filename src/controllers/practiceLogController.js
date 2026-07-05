const VocabularyItem = require("../models/VocabularyItem");
const PracticeLog = require("../models/PracticeLog");
const LearningQueue = require("../models/LearningQueue");

const ALLOWED_TYPES = [
  "listening",
  "speaking",
  "shadowing",
  "sentence_making",
  "dictation",
];

exports.create = async (req, res) => {
  try {
    const { vocabularyItemId, practiceType, score, note } = req.body;

    if (!vocabularyItemId) {
      return res.status(400).json({ message: "vocabularyItemId is required." });
    }

    const item = await VocabularyItem.findById(vocabularyItemId);
    if (!item) {
      return res.status(404).json({ message: "Vocabulary item not found." });
    }

    if (!practiceType || !ALLOWED_TYPES.includes(practiceType)) {
      return res.status(400).json({
        message: `practiceType must be one of: ${ALLOWED_TYPES.join(", ")}`,
      });
    }

    if (score !== undefined && score !== null) {
      const s = Number(score);
      if (!Number.isInteger(s) || s < 1 || s > 5) {
        return res.status(400).json({ message: "score must be an integer between 1 and 5." });
      }
    }

    const log = await PracticeLog.create({
      vocabularyItemId,
      practiceType,
      score: score != null ? Number(score) : undefined,
      note,
    });

    await LearningQueue.findOneAndUpdate(
      { vocabularyItemId },
      {
        $inc: { reviewCount: 1 },
        $set: { lastReviewedAt: new Date() },
      }
    );

    res.status(201).json({ message: "Practice log created.", data: log });
  } catch (err) {
    res.status(500).json({ message: "Failed to create practice log.", error: err.message });
  }
};
