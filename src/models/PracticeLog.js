const mongoose = require("mongoose");

const practiceLogSchema = new mongoose.Schema(
  {
    vocabularyItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VocabularyItem",
      required: true,
    },
    practiceType: {
      type: String,
      enum: [
        "listening",
        "speaking",
        "shadowing",
        "sentence_making",
        "dictation",
      ],
    },
    score: { type: Number },
    note: { type: String },
    practicedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PracticeLog", practiceLogSchema);
