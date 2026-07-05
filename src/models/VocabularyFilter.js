const mongoose = require("mongoose");

const vocabularyFilterSchema = new mongoose.Schema(
  {
    filterText: { type: String, required: true },
    normalizedText: { type: String, required: true },
    filterType: {
      type: String,
      enum: ["stop_word", "known_word", "filler", "keep_phrase"],
    },
    action: {
      type: String,
      enum: ["remove", "exclude_from_learning", "keep", "low_priority"],
    },
    familiarityLevel: { type: Number },
    meaningCn: { type: String },
    isActive: { type: Boolean, default: true },
    notes: { type: String },
  },
  { timestamps: true }
);

vocabularyFilterSchema.index({ normalizedText: 1, filterType: 1 });
vocabularyFilterSchema.index({ isActive: 1 });

module.exports = mongoose.model("VocabularyFilter", vocabularyFilterSchema);
