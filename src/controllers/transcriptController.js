const Transcript = require("../models/Transcript");
const Lesson = require("../models/Lesson");
const AsrCorrection = require("../models/AsrCorrection");

function deriveStatus(rawText, correctedText, cleanedText) {
  if (cleanedText) return "cleaned";
  if (correctedText) return "corrected";
  if (rawText) return "raw";
  return null;
}

exports.get = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found." });
    }

    const transcript = await Transcript.findOne({ lessonId: req.params.lessonId });
    if (!transcript) {
      return res.status(404).json({ message: "Transcript not found for this lesson." });
    }

    res.json({ data: transcript });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch transcript.", error: err.message });
  }
};

exports.createOrUpdate = async (req, res) => {
  try {
    const { rawText, correctedText, cleanedText, correctionNotes } = req.body;

    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found." });
    }

    const transcript = await Transcript.findOneAndUpdate(
      { lessonId: req.params.lessonId },
      { lessonId: req.params.lessonId, rawText, correctedText, cleanedText, correctionNotes },
      { new: true, upsert: true, runValidators: true }
    );

    const newStatus = deriveStatus(rawText, correctedText, cleanedText);
    if (newStatus) {
      await Lesson.findByIdAndUpdate(req.params.lessonId, { status: newStatus });
    }

    res.status(201).json({ message: "Transcript saved.", data: transcript });
  } catch (err) {
    res.status(500).json({ message: "Failed to save transcript.", error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { rawText, correctedText, cleanedText, correctionNotes } = req.body;

    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found." });
    }

    const transcript = await Transcript.findOne({ lessonId: req.params.lessonId });
    if (!transcript) {
      return res.status(404).json({ message: "Transcript not found. Use POST to create one first." });
    }

    if (rawText !== undefined) transcript.rawText = rawText;
    if (correctedText !== undefined) transcript.correctedText = correctedText;
    if (cleanedText !== undefined) transcript.cleanedText = cleanedText;
    if (correctionNotes !== undefined) transcript.correctionNotes = correctionNotes;

    await transcript.save();

    const newStatus = deriveStatus(
      transcript.rawText,
      transcript.correctedText,
      transcript.cleanedText
    );
    if (newStatus) {
      await Lesson.findByIdAndUpdate(req.params.lessonId, { status: newStatus });
    }

    res.json({ message: "Transcript updated.", data: transcript });
  } catch (err) {
    res.status(500).json({ message: "Failed to update transcript.", error: err.message });
  }
};

exports.upload = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded. Please upload a .txt file." });
    }

    const rawText = req.file.buffer.toString("utf-8");
    const sourceFileName = req.file.originalname;

    const transcript = await Transcript.findOneAndUpdate(
      { lessonId: req.params.lessonId },
      { lessonId: req.params.lessonId, rawText },
      { new: true, upsert: true, runValidators: true }
    );

    await Lesson.findByIdAndUpdate(req.params.lessonId, {
      sourceFileName,
      status: "raw",
    });

    res.status(201).json({ message: "Transcript uploaded.", data: transcript });
  } catch (err) {
    res.status(500).json({ message: "Failed to upload transcript.", error: err.message });
  }
};

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isWordLike(str) {
  return /^\w/.test(str) && /\w$/.test(str);
}

exports.correct = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found." });
    }

    const transcript = await Transcript.findOne({ lessonId: req.params.lessonId });
    if (!transcript || !transcript.rawText) {
      return res.status(400).json({ message: "Transcript has no rawText to correct." });
    }

    const corrections = await AsrCorrection.find({
      isActive: true,
      $or: [
        { courseId: null },
        { courseId: lesson.courseId },
      ],
    }).lean();

    corrections.sort((a, b) => b.rawText.length - a.rawText.length);

    let text = transcript.rawText;
    const replacementsApplied = [];

    for (const correction of corrections) {
      const escaped = escapeRegex(correction.rawText);
      const pattern = isWordLike(correction.rawText)
        ? "\\b" + escaped + "\\b"
        : escaped;
      const regex = new RegExp(pattern, "gi");

      const count = (text.match(regex) || []).length;
      if (count > 0) {
        text = text.replace(regex, correction.correctedText);
        replacementsApplied.push({
          rawText: correction.rawText,
          correctedText: correction.correctedText,
          count,
        });
      }
    }

    transcript.correctedText = text;
    await transcript.save();

    await Lesson.findByIdAndUpdate(req.params.lessonId, { status: "corrected" });

    res.json({
      message: "Correction applied.",
      data: {
        correctedText: text,
        replacementsApplied,
        correctionCount: replacementsApplied.reduce((sum, r) => sum + r.count, 0),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to apply correction.", error: err.message });
  }
};
