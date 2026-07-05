const mongoose = require("mongoose");

const learningQueueSchema = new mongoose.Schema(
  {
    vocabularyItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VocabularyItem",
      required: true,
      unique: true,
    },
    learningStatus: {
      type: String,
      enum: ["new", "learning", "reviewing", "mastered", "ignored"],
      default: "new",
    },
    priorityScore: { type: Number, default: 0 },
    nextReviewDate: { type: String },
    reviewCount: { type: Number, default: 0 },
    lastReviewedAt: { type: Date },
  },
  { timestamps: true }
);

learningQueueSchema.index(
  { learningStatus: 1, priorityScore: -1 }
);
learningQueueSchema.index({ nextReviewDate: 1 });

module.exports = mongoose.model("LearningQueue", learningQueueSchema);
