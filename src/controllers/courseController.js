const Course = require("../models/Course");

exports.list = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json({ count: courses.length, data: courses });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch courses.", error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { courseCode, courseName, teacherName, semester } = req.body;

    if (!courseCode || !courseName) {
      return res.status(400).json({ message: "courseCode and courseName are required." });
    }

    const course = await Course.create({ courseCode, courseName, teacherName, semester });
    res.status(201).json({ message: "Course created.", data: course });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A course with this courseCode already exists." });
    }
    res.status(500).json({ message: "Failed to create course.", error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }
    res.json({ data: course });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch course.", error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { courseCode, courseName, teacherName, semester } = req.body;

    if (courseCode === "" || courseName === "") {
      return res.status(400).json({ message: "courseCode and courseName cannot be empty." });
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { courseCode, courseName, teacherName, semester },
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    res.json({ message: "Course updated.", data: course });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A course with this courseCode already exists." });
    }
    res.status(500).json({ message: "Failed to update course.", error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }
    res.json({ message: "Course deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete course.", error: err.message });
  }
};
