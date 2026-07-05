const mongoose = require("mongoose");

const exampleSchema = new mongoose.Schema(
  {
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
    sentence: { type: String },
    source: { type: String },
  },
  { _id: false }
);

const vocabularyItemSchema = new mongoose.Schema(
  {
    itemText: { type: String, required: true },
    normalizedText: { type: String, required: true, unique: true },
    itemType: {
      type: String,
      enum: [
        "core_term",
        "technical_phrase",
        "classroom_instruction",
        "assignment_phrase",
        "speaking_sentence",
        "discourse_marker",
        "filler",
      ],
    },
    meaningCn: { type: String },
    globalFrequency: { type: Number, default: 0 },
    courseCount: { type: Number, default: 0 },
    lessonCount: { type: Number, default: 0 },
    familiarityLevel: { type: Number, default: 0 },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    isLearningTarget: { type: Boolean, default: true },
    tags: [{ type: String }],
    examples: [exampleSchema],
    metadata: {
      technicalCategory: { type: String },
      phrasePattern: { type: String },
      instructionAction: { type: String },
      instructionTarget: { type: String },
      classroomSituation: { type: String },
    },
    notes: { type: String },
  },
  { timestamps: true }
);

vocabularyItemSchema.index({ itemType: 1 });
vocabularyItemSchema.index({ globalFrequency: -1 });
vocabularyItemSchema.index({ lessonCount: -1 });
vocabularyItemSchema.index({ isLearningTarget: 1, familiarityLevel: 1 });

module.exports = mongoose.model("VocabularyItem", vocabularyItemSchema);
