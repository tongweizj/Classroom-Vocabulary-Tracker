const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const Transcript = require("../models/Transcript");
const VocabularyItem = require("../models/VocabularyItem");
const LessonVocabularyStat = require("../models/LessonVocabularyStat");
const LearningQueue = require("../models/LearningQueue");
const Prompt = require("../models/Prompt");

require("../models/VocabularyItem");

exports.coursesPage = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 }).lean();
    res.render("courses", { title: "Courses", active: "courses", courses });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.lessonsPage = async (req, res) => {
  try {
    const courses = await Course.find().sort({ courseCode: 1 }).lean();
    const lessons = await Lesson.find()
      .populate("courseId", "courseCode courseName")
      .sort({ sessionDate: -1 })
      .lean();
    res.render("lessons", { title: "Lessons", active: "lessons", lessons, courses });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.lessonDetailPage = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate("courseId", "courseCode courseName")
      .lean();
    if (!lesson) return res.status(404).send("Lesson not found.");

    const transcript = await Transcript.findOne({ lessonId: req.params.id }).lean();

    res.render("lesson-detail", {
      title: "Lesson Detail",
      active: "lessons",
      lesson,
      transcript: transcript || null,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.lessonVocabPage = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate("courseId", "courseCode courseName")
      .lean();
    if (!lesson) return res.status(404).send("Lesson not found.");

    const stats = await LessonVocabularyStat.find({ lessonId: req.params.id })
      .populate("vocabularyItemId")
      .sort({ frequency: -1 })
      .lean();

    const vocab = stats.filter((s) => s.vocabularyItemId).map((s) => ({
      vocabularyItemId: s.vocabularyItemId._id,
      itemText: s.vocabularyItemId.itemText,
      normalizedText: s.vocabularyItemId.normalizedText,
      itemType: s.vocabularyItemId.itemType,
      meaningCn: s.vocabularyItemId.meaningCn,
      frequency: s.frequency,
      sourceSentence: s.sourceSentence,
      exampleSentence: s.exampleSentence,
      familiarityLevel: s.vocabularyItemId.familiarityLevel,
      priority: s.vocabularyItemId.priority,
      isLearningTarget: s.vocabularyItemId.isLearningTarget,
      tags: s.vocabularyItemId.tags,
      metadata: s.vocabularyItemId.metadata,
    }));

    const grouped = {};
    for (const v of vocab) {
      const t = v.itemType || "unknown";
      grouped[t] = (grouped[t] || 0) + 1;
    }

    res.render("lesson-vocabulary", {
      title: "Lesson Vocabulary",
      active: "lessons",
      lesson,
      vocab: { count: vocab.length, groupedByType: grouped, data: vocab },
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.vocabularyPage = async (req, res) => {
  try {
    const filter = {};
    if (req.query.itemType) filter.itemType = req.query.itemType;
    if (req.query.isLearningTarget !== undefined) {
      filter.isLearningTarget = req.query.isLearningTarget === "true";
    }
    if (req.query.minGlobalFrequency) {
      filter.globalFrequency = { $gte: Number(req.query.minGlobalFrequency) };
    }
    if (req.query.keyword) {
      filter.$or = [
        { itemText: { $regex: req.query.keyword, $options: "i" } },
        { meaningCn: { $regex: req.query.keyword, $options: "i" } },
      ];
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      VocabularyItem.find(filter)
        .sort({ globalFrequency: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      VocabularyItem.countDocuments(filter),
    ]);

    res.render("vocabulary", {
      title: "Global Vocabulary",
      active: "vocabulary",
      data: items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      query: req.query,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.learningQueuePage = async (req, res) => {
  try {
    const queue = await LearningQueue.find()
      .populate("vocabularyItemId", "itemText itemType meaningCn")
      .sort({ priorityScore: -1 })
      .lean();

    res.render("learning-queue", {
      title: "Learning Queue",
      active: "queue",
      queue: queue.filter((q) => q.vocabularyItemId),
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.promptsPage = async (req, res) => {
  try {
    res.render("prompts", { title: "Prompts", active: "prompts" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.vocabStudyPage = async (req, res) => {
  try {
    const item = await VocabularyItem.findById(req.params.id).lean();
    if (!item) return res.status(404).send("Vocabulary item not found.");
    res.render("vocabulary-study", { title: item.itemText, active: "vocabulary", item });
  } catch (err) {
    res.status(500).send(err.message);
  }
};
