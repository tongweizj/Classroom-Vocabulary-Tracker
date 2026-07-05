const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    courseCode: { type: String, required: true },
    courseName: { type: String, required: true },
    teacherName: { type: String },
    semester: { type: String },
  },
  { timestamps: true }
);

courseSchema.index({ courseCode: 1, semester: 1 });

module.exports = mongoose.model("Course", courseSchema);
