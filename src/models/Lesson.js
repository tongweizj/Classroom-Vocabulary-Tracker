const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    sessionDate: { type: String, required: true },
    topic: { type: String },
    sourceFileName: { type: String },
    status: {
      type: String,
      enum: ["raw", "corrected", "cleaned", "structured"],
      default: "raw",
    },
    summary: {
      totalVocabularyItems: { type: Number },
      coreTermCount: { type: Number },
      technicalPhraseCount: { type: Number },
      classroomInstructionCount: { type: Number },
      assignmentPhraseCount: { type: Number },
      speakingSentenceCount: { type: Number },
    },
  },
  { timestamps: true }
);

lessonSchema.index({ courseId: 1, sessionDate: -1 });

module.exports = mongoose.model("Lesson", lessonSchema);
