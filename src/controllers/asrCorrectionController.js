const AsrCorrection = require("../models/AsrCorrection");
const Course = require("../models/Course");
const { normalizeExpression } = require("../utils/normalize");

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";
    if (req.query.correctionType) filter.correctionType = req.query.correctionType;
    if (req.query.courseId) filter.courseId = req.query.courseId;

    const corrections = await AsrCorrection.find(filter)
      .populate("courseId", "courseCode courseName")
      .sort({ createdAt: -1 });

    res.json({ count: corrections.length, data: corrections });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch corrections.", error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { rawText, correctedText, correctionType, courseId, confidence, isActive, notes } = req.body;

    if (!rawText || !correctedText) {
      return res.status(400).json({ message: "rawText and correctedText are required." });
    }

    if (courseId) {
      const courseExists = await Course.findById(courseId);
      if (!courseExists) {
        return res.status(404).json({ message: "Course not found. courseId is invalid." });
      }
    }

    const normalizedRawText = normalizeExpression(rawText);

    const correction = await AsrCorrection.create({
      rawText,
      normalizedRawText,
      correctedText,
      correctionType,
      courseId: courseId || undefined,
      confidence,
      isActive,
      notes,
    });

    const populated = courseId
      ? await correction.populate("courseId", "courseCode courseName")
      : correction;

    res.status(201).json({ message: "Correction created.", data: populated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "A correction with this normalizedRawText already exists for this course.",
      });
    }
    res.status(500).json({ message: "Failed to create correction.", error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { rawText, correctedText, correctionType, courseId, confidence, isActive, notes } = req.body;

    const existing = await AsrCorrection.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Correction not found." });
    }

    if (courseId) {
      const courseExists = await Course.findById(courseId);
      if (!courseExists) {
        return res.status(404).json({ message: "Course not found. courseId is invalid." });
      }
    }

    if (rawText !== undefined) {
      existing.rawText = rawText;
      existing.normalizedRawText = normalizeExpression(rawText);
    }
    if (correctedText !== undefined) existing.correctedText = correctedText;
    if (correctionType !== undefined) existing.correctionType = correctionType;
    if (courseId !== undefined) existing.courseId = courseId || null;
    if (confidence !== undefined) existing.confidence = confidence;
    if (isActive !== undefined) existing.isActive = isActive;
    if (notes !== undefined) existing.notes = notes;

    await existing.save();

    const populated = existing.courseId
      ? await existing.populate("courseId", "courseCode courseName")
      : existing;

    res.json({ message: "Correction updated.", data: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to update correction.", error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const correction = await AsrCorrection.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!correction) {
      return res.status(404).json({ message: "Correction not found." });
    }

    res.json({ message: "Correction deactivated.", data: correction });
  } catch (err) {
    res.status(500).json({ message: "Failed to deactivate correction.", error: err.message });
  }
};
