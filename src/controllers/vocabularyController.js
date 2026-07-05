const Lesson = require("../models/Lesson");
const VocabularyItem = require("../models/VocabularyItem");
const LessonVocabularyStat = require("../models/LessonVocabularyStat");
const LearningQueue = require("../models/LearningQueue");
const PracticeLog = require("../models/PracticeLog");
const { normalizeExpression } = require("../utils/normalize");

const ALLOWED_ITEM_TYPES = [
  "core_term",
  "technical_phrase",
  "classroom_instruction",
  "assignment_phrase",
  "speaking_sentence",
  "discourse_marker",
  "filler",
];

const ALLOWED_PRIORITIES = ["high", "medium", "low"];

const SUMMARY_FIELD_MAP = {
  core_term: "coreTermCount",
  technical_phrase: "technicalPhraseCount",
  classroom_instruction: "classroomInstructionCount",
  assignment_phrase: "assignmentPhraseCount",
  speaking_sentence: "speakingSentenceCount",
};

exports.importItems = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found." });
    }

    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items array is required and must not be empty." });
    }

    let createdItems = 0;
    let reusedItems = 0;
    let statsCreated = 0;
    let statsUpdated = 0;
    const processedItemIds = [];

    for (const item of items) {
      if (!item.itemText) {
        return res.status(400).json({
          message: `itemText is required. Received: ${JSON.stringify(item)}`,
        });
      }

      if (item.itemType && !ALLOWED_ITEM_TYPES.includes(item.itemType)) {
        return res.status(400).json({
          message: `Invalid itemType "${item.itemType}". Allowed: ${ALLOWED_ITEM_TYPES.join(", ")}`,
        });
      }

      if (item.priority && !ALLOWED_PRIORITIES.includes(item.priority)) {
        return res.status(400).json({
          message: `Invalid priority "${item.priority}". Allowed: ${ALLOWED_PRIORITIES.join(", ")}`,
        });
      }

      const rawFreq = item.frequency;
      const frequency = rawFreq != null && rawFreq !== "" ? Number(rawFreq) : 1;
      if (isNaN(frequency) || frequency <= 0) {
        return res.status(400).json({
          message: `frequency must be a positive number. Got: ${item.frequency}`,
        });
      }

      const normalizedText = normalizeExpression(item.itemText);

      let vocabItem = await VocabularyItem.findOne({ normalizedText });

      if (vocabItem) {
        reusedItems++;

        vocabItem.itemType = item.itemType || vocabItem.itemType;
        vocabItem.meaningCn = item.meaningCn || vocabItem.meaningCn;
        vocabItem.priority = item.priority || vocabItem.priority;
        if (item.isLearningTarget !== undefined) vocabItem.isLearningTarget = item.isLearningTarget;
        if (item.tags) vocabItem.tags = item.tags;
        if (item.metadata) vocabItem.metadata = { ...vocabItem.metadata, ...item.metadata };
        await vocabItem.save();
      } else {
        vocabItem = await VocabularyItem.create({
          itemText: item.itemText,
          normalizedText,
          itemType: item.itemType || undefined,
          meaningCn: item.meaningCn,
          priority: item.priority || "medium",
          isLearningTarget: item.isLearningTarget !== undefined ? item.isLearningTarget : true,
          tags: item.tags || [],
          metadata: item.metadata || {},
        });
        createdItems++;
      }

      processedItemIds.push(vocabItem._id);

      const existingStat = await LessonVocabularyStat.findOne({
        lessonId: lesson._id,
        vocabularyItemId: vocabItem._id,
      });

      if (existingStat) {
        existingStat.frequency += frequency;
        existingStat.sourceSentence = item.sourceSentence || existingStat.sourceSentence;
        existingStat.exampleSentence = item.exampleSentence || existingStat.exampleSentence;
        existingStat.courseId = lesson.courseId;
        await existingStat.save();
        statsUpdated++;
      } else {
        await LessonVocabularyStat.create({
          lessonId: lesson._id,
          courseId: lesson.courseId,
          vocabularyItemId: vocabItem._id,
          frequency,
          sourceSentence: item.sourceSentence,
          exampleSentence: item.exampleSentence,
        });
        statsCreated++;
      }
    }

    const uniqueItemIds = [...new Set(processedItemIds.map((id) => id.toString()))];

    for (const itemId of uniqueItemIds) {
      const stats = await LessonVocabularyStat.aggregate([
        { $match: { vocabularyItemId: new (require("mongoose").Types.ObjectId)(itemId) } },
        {
          $group: {
            _id: null,
            globalFrequency: { $sum: "$frequency" },
            uniqueLessons: { $addToSet: "$lessonId" },
            uniqueCourses: { $addToSet: "$courseId" },
          },
        },
      ]);

      if (stats.length > 0) {
        await VocabularyItem.findByIdAndUpdate(itemId, {
          globalFrequency: stats[0].globalFrequency,
          lessonCount: stats[0].uniqueLessons.length,
          courseCount: stats[0].uniqueCourses.length,
        });
      }
    }

    const lessonStats = await LessonVocabularyStat.aggregate([
      { $match: { lessonId: lesson._id } },
      {
        $lookup: {
          from: "vocabularyitems",
          localField: "vocabularyItemId",
          foreignField: "_id",
          as: "item",
        },
      },
      { $unwind: "$item" },
      {
        $group: {
          _id: "$item.itemType",
          count: { $sum: 1 },
        },
      },
    ]);

    const summaryUpdates = {
      totalVocabularyItems: lessonStats.reduce((s, g) => s + g.count, 0),
      coreTermCount: 0,
      technicalPhraseCount: 0,
      classroomInstructionCount: 0,
      assignmentPhraseCount: 0,
      speakingSentenceCount: 0,
    };

    for (const group of lessonStats) {
      const field = SUMMARY_FIELD_MAP[group._id];
      if (field) {
        summaryUpdates[field] = group.count;
      }
    }

    await Lesson.findByIdAndUpdate(lesson._id, { summary: summaryUpdates });

    res.json({
      message: "Vocabulary import complete.",
      data: {
        createdItems,
        reusedItems,
        statsCreated,
        statsUpdated,
        totalItemsProcessed: createdItems + reusedItems,
        summary: summaryUpdates,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vocabulary.", error: err.message });
  }
};

exports.updateFamiliarity = async (req, res) => {
  try {
    const { familiarityLevel } = req.body;

    if (familiarityLevel === undefined || familiarityLevel === null) {
      return res.status(400).json({ message: "familiarityLevel is required." });
    }

    const level = Number(familiarityLevel);
    if (!Number.isInteger(level) || level < 0 || level > 3) {
      return res.status(400).json({ message: "familiarityLevel must be an integer between 0 and 3." });
    }

    const item = await VocabularyItem.findByIdAndUpdate(
      req.params.id,
      { familiarityLevel: level },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: "Vocabulary item not found." });
    }

    res.json({ message: "Familiarity updated.", data: item });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vocabulary.", error: err.message });
  }
};

exports.studyDetail = async (req, res) => {
  try {
    const item = await VocabularyItem.findById(req.params.id).lean();
    if (!item) {
      return res.status(404).json({ message: "Vocabulary item not found." });
    }

    const [lessonStats, queueItem, recentLogs] = await Promise.all([
      LessonVocabularyStat.find({ vocabularyItemId: req.params.id })
        .populate("lessonId", "sessionDate topic status")
        .populate("courseId", "courseCode courseName")
        .sort({ createdAt: -1 })
        .lean(),
      LearningQueue.findOne({ vocabularyItemId: req.params.id }).lean(),
      PracticeLog.find({ vocabularyItemId: req.params.id })
        .sort({ practicedAt: -1 })
        .limit(10)
        .lean(),
    ]);

    res.json({
      data: {
        item,
        lessonStats,
        queueItem: queueItem || null,
        recentLogs,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch study detail.", error: err.message });
  }
};

exports.listByLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found." });
    }

    const filter = { lessonId: lesson._id };
    const itemFilter = {};

    if (req.query.itemType) {
      itemFilter.itemType = req.query.itemType;
    }
    if (req.query.isLearningTarget !== undefined) {
      itemFilter.isLearningTarget = req.query.isLearningTarget === "true";
    }
    if (req.query.minFrequency) {
      filter.frequency = { $gte: Number(req.query.minFrequency) };
    }

    const sortField = req.query.sort || "-frequency";
    const sortObj = {};
    const dir = sortField.startsWith("-") ? -1 : 1;
    const field = sortField.startsWith("-") ? sortField.slice(1) : sortField;
    sortObj[field] = dir;

    const stats = await LessonVocabularyStat.find(filter)
      .populate({
        path: "vocabularyItemId",
        match: Object.keys(itemFilter).length ? itemFilter : {},
        select:
          "itemText normalizedText itemType meaningCn familiarityLevel priority isLearningTarget tags metadata",
      })
      .sort(sortObj)
      .lean();

    const items = stats
      .filter((s) => s.vocabularyItemId)
      .map((s) => ({
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
    for (const item of items) {
      const t = item.itemType || "unknown";
      grouped[t] = (grouped[t] || 0) + 1;
    }

    res.json({
      count: items.length,
      groupedByType: grouped,
      data: items,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vocabulary.", error: err.message });
  }
};

exports.listAll = async (req, res) => {
  try {
    const filter = {};

    if (req.query.itemType) filter.itemType = req.query.itemType;
    if (req.query.isLearningTarget !== undefined) {
      filter.isLearningTarget = req.query.isLearningTarget === "true";
    }
    if (req.query.familiarityLevel !== undefined) {
      filter.familiarityLevel = Number(req.query.familiarityLevel);
    }
    if (req.query.minGlobalFrequency) {
      filter.globalFrequency = { $gte: Number(req.query.minGlobalFrequency) };
    }
    if (req.query.minLessonCount) {
      filter.lessonCount = { $gte: Number(req.query.minLessonCount) };
    }
    if (req.query.minCourseCount) {
      filter.courseCount = { $gte: Number(req.query.minCourseCount) };
    }
    if (req.query.keyword) {
      const kw = req.query.keyword;
      filter.$or = [
        { itemText: { $regex: kw, $options: "i" } },
        { normalizedText: { $regex: kw, $options: "i" } },
        { meaningCn: { $regex: kw, $options: "i" } },
      ];
    }

    const sortField = req.query.sort || "-globalFrequency";
    const dir = sortField.startsWith("-") ? -1 : 1;
    const field = sortField.startsWith("-") ? sortField.slice(1) : sortField;
    const sortObj = { [field]: dir, lessonCount: -1 };

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      VocabularyItem.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .select(
          "itemText normalizedText itemType meaningCn globalFrequency courseCount lessonCount familiarityLevel priority isLearningTarget tags metadata"
        )
        .lean(),
      VocabularyItem.countDocuments(filter),
    ]);

    res.json({
      data: items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vocabulary.", error: err.message });
  }
};
