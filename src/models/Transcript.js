const mongoose = require("mongoose");

const segmentSchema = new mongoose.Schema(
  {
    speaker: { type: String },
    rawText: { type: String },
    cleanText: { type: String },
    startTime: { type: Number },
    endTime: { type: Number },
  },
  { _id: false }
);

const transcriptSchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      unique: true,
    },
    rawText: { type: String },
    correctedText: { type: String },
    cleanedText: { type: String },
    correctionNotes: { type: String },
    segments: [segmentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transcript", transcriptSchema);
