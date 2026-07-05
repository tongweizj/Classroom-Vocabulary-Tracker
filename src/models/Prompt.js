const mongoose = require("mongoose");

const promptSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, enum: ["correction", "cleaning", "vocabulary", "general"], default: "general" },
    content: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

promptSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model("Prompt", promptSchema);
