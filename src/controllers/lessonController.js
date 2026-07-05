const Lesson = require("../models/Lesson");
const Course = require("../models/Course");

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.courseId) filter.courseId = req.query.courseId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.sessionDate) filter.sessionDate = req.query.sessionDate;

    const lessons = await Lesson.find(filter)
      .populate("courseId", "courseCode courseName semester")
      .sort({ sessionDate: -1 });

    res.json({ count: lessons.length, data: lessons });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch lessons.", error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate("courseId", "courseCode courseName semester");

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found." });
    }

    res.json({ data: lesson });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch lesson.", error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { courseId, sessionDate, topic, sourceFileName, status } = req.body;

    if (!courseId || !sessionDate) {
      return res.status(400).json({ message: "courseId and sessionDate are required." });
    }

    const courseExists = await Course.findById(courseId);
    if (!courseExists) {
      return res.status(404).json({ message: "Course not found. courseId is invalid." });
    }

    const lesson = await Lesson.create({
      courseId,
      sessionDate,
      topic,
      sourceFileName,
      status,
    });

    const populated = await lesson.populate("courseId", "courseCode courseName semester");

    res.status(201).json({ message: "Lesson created.", data: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to create lesson.", error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { courseId, sessionDate, topic, sourceFileName, status } = req.body;

    if (courseId === "" || sessionDate === "") {
      return res.status(400).json({ message: "courseId and sessionDate cannot be empty." });
    }

    if (courseId) {
      const courseExists = await Course.findById(courseId);
      if (!courseExists) {
        return res.status(404).json({ message: "Course not found. courseId is invalid." });
      }
    }

    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { courseId, sessionDate, topic, sourceFileName, status },
      { new: true, runValidators: true }
    ).populate("courseId", "courseCode courseName semester");

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found." });
    }

    res.json({ message: "Lesson updated.", data: lesson });
  } catch (err) {
    res.status(500).json({ message: "Failed to update lesson.", error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found." });
    }
    res.json({ message: "Lesson deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete lesson.", error: err.message });
  }
};
