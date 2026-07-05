const mongoose = require("mongoose");

const asrCorrectionSchema = new mongoose.Schema(
  {
    rawText: { type: String, required: true },
    normalizedRawText: { type: String, required: true },
    correctedText: { type: String, required: true },
    correctionType: {
      type: String,
      enum: ["technical_term", "phrase", "file_name", "framework", "other"],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    confidence: { type: Number, default: 1.0 },
    isActive: { type: Boolean, default: true },
    notes: { type: String },
  },
  { timestamps: true }
);

asrCorrectionSchema.index({ normalizedRawText: 1 });
asrCorrectionSchema.index({ courseId: 1, normalizedRawText: 1 });

module.exports = mongoose.model("AsrCorrection", asrCorrectionSchema);
