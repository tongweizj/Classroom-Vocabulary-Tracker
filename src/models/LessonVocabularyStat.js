const mongoose = require("mongoose");

const lessonVocabularyStatSchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    vocabularyItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VocabularyItem",
      required: true,
    },
    frequency: { type: Number, default: 1 },
    sourceSentence: { type: String },
    exampleSentence: { type: String },
    importanceScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

lessonVocabularyStatSchema.index(
  { lessonId: 1, vocabularyItemId: 1 },
  { unique: true }
);
lessonVocabularyStatSchema.index({ vocabularyItemId: 1 });
lessonVocabularyStatSchema.index({ courseId: 1 });
lessonVocabularyStatSchema.index({ frequency: -1 });

module.exports = mongoose.model("LessonVocabularyStat", lessonVocabularyStatSchema);
